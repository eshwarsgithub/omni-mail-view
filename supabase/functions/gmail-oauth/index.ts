import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { action, code, accountId, apiKeyId } = await req.json()

    if (action === 'initiate') {
      // Get API key for this user
      const { data: apiKey, error: apiKeyError } = await supabaseClient
        .from('api_keys')
        .select('*')
        .eq('id', apiKeyId)
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .single()

      if (apiKeyError) throw apiKeyError

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', apiKey.client_id)
      authUrl.searchParams.set('redirect_uri', apiKey.redirect_uri || `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-oauth`)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', apiKey.scopes?.join(' ') || 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', `${user.id}:${accountId}:${apiKeyId}`)

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'callback') {
      // Exchange code for tokens
      const [userId, accountId, apiKeyId] = (new URL(req.url).searchParams.get('state') || '').split(':')

      const { data: apiKey } = await supabaseClient
        .from('api_keys')
        .select('*')
        .eq('id', apiKeyId)
        .eq('user_id', userId)
        .single()

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: apiKey.client_id,
          client_secret: apiKey.client_secret,
          redirect_uri: apiKey.redirect_uri || `${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-oauth`,
          grant_type: 'authorization_code'
        })
      })

      const tokens = await tokenResponse.json()

      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error)
      }

      // Store tokens
      const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

      await supabaseClient
        .from('oauth_tokens')
        .insert({
          account_id: accountId,
          provider: 'gmail',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString()
        })

      // Update account status
      await supabaseClient
        .from('mail_accounts')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', accountId)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'refresh') {
      // Refresh access token
      const { data: tokens } = await supabaseClient
        .from('oauth_tokens')
        .select('*, mail_accounts!inner(user_id)')
        .eq('account_id', accountId)
        .single()

      if (tokens.mail_accounts.user_id !== user.id) {
        throw new Error('Unauthorized')
      }

      const { data: apiKey } = await supabaseClient
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .single()

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: tokens.refresh_token,
          client_id: apiKey.client_id,
          client_secret: apiKey.client_secret,
          grant_type: 'refresh_token'
        })
      })

      const newTokens = await refreshResponse.json()

      if (newTokens.error) {
        throw new Error(newTokens.error_description || newTokens.error)
      }

      const expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000))

      await supabaseClient
        .from('oauth_tokens')
        .update({
          access_token: newTokens.access_token,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', tokens.id)

      return new Response(
        JSON.stringify({ accessToken: newTokens.access_token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
