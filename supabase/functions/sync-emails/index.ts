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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { accountId, syncType = 'incremental' } = await req.json()

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from('mail_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accountError) throw accountError

    // Create sync job
    const { data: syncJob } = await supabaseClient
      .from('sync_jobs')
      .insert({
        account_id: accountId,
        job_type: syncType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    try {
      // Get OAuth tokens
      const { data: tokens } = await supabaseClient
        .from('oauth_tokens')
        .select('*')
        .eq('account_id', accountId)
        .single()

      if (!tokens) {
        throw new Error('No OAuth tokens found')
      }

      // Check if token needs refresh
      const expiresAt = new Date(tokens.expires_at)
      let accessToken = tokens.access_token

      if (expiresAt < new Date()) {
        // Refresh token
        const refreshResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-oauth`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'refresh',
            accountId
          })
        })

        const refreshData = await refreshResponse.json()
        accessToken = refreshData.accessToken
      }

      // Fetch messages from Gmail API
      let pageToken = null
      let messagesSynced = 0
      const maxResults = 100

      do {
        const gmailUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
        gmailUrl.searchParams.set('maxResults', maxResults.toString())
        if (pageToken) gmailUrl.searchParams.set('pageToken', pageToken)
        if (syncType === 'incremental' && account.last_sync_at) {
          const afterTimestamp = Math.floor(new Date(account.last_sync_at).getTime() / 1000)
          gmailUrl.searchParams.set('q', `after:${afterTimestamp}`)
        }

        const messagesResponse = await fetch(gmailUrl.toString(), {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })

        const messagesData = await messagesResponse.json()

        if (messagesData.messages) {
          // Fetch full message details
          for (const msg of messagesData.messages) {
            const messageResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            )
            const messageData = await messageResponse.json()

            // Parse message
            const headers = messageData.payload.headers
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value

            const subject = getHeader('Subject') || '(no subject)'
            const from = getHeader('From') || ''
            const to = getHeader('To') || ''
            const date = getHeader('Date') || new Date().toISOString()

            // Extract body
            let bodyText = ''
            let bodyHtml = ''

            const extractBody = (part: any) => {
              if (part.mimeType === 'text/plain' && part.body?.data) {
                bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
              } else if (part.mimeType === 'text/html' && part.body?.data) {
                bodyHtml = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
              } else if (part.parts) {
                part.parts.forEach(extractBody)
              }
            }

            if (messageData.payload.parts) {
              messageData.payload.parts.forEach(extractBody)
            } else if (messageData.payload.body?.data) {
              extractBody(messageData.payload)
            }

            const snippet = bodyText.substring(0, 200) || bodyHtml.substring(0, 200).replace(/<[^>]*>/g, '')

            // Parse from address
            const fromMatch = from.match(/<(.+?)>/) || [null, from]
            const fromEmail = fromMatch[1] || from
            const fromName = from.replace(/<.+?>/, '').trim()

            // Store message
            await supabaseClient
              .from('messages')
              .upsert({
                user_id: user.id,
                account_id: accountId,
                message_id: messageData.id,
                subject,
                from_address: fromEmail,
                from_name: fromName,
                to_addresses: to.split(',').map((a: string) => a.trim()),
                date: new Date(date).toISOString(),
                body_text: bodyText,
                body_html: bodyHtml,
                snippet,
                has_attachments: messageData.payload.parts?.some((p: any) => p.filename) || false,
                is_read: !messageData.labelIds?.includes('UNREAD'),
                is_starred: messageData.labelIds?.includes('STARRED') || false,
                is_spam: messageData.labelIds?.includes('SPAM') || false,
                labels: messageData.labelIds || []
              }, {
                onConflict: 'user_id,message_id'
              })

            messagesSynced++
          }
        }

        pageToken = messagesData.nextPageToken

      } while (pageToken && syncType === 'full')

      // Update sync job
      await supabaseClient
        .from('sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          messages_synced: messagesSynced
        })
        .eq('id', syncJob.id)

      // Update account
      await supabaseClient
        .from('mail_accounts')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', accountId)

      return new Response(
        JSON.stringify({ success: true, messagesSynced }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      // Update sync job with error
      await supabaseClient
        .from('sync_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', syncJob.id)

      // Update account
      await supabaseClient
        .from('mail_accounts')
        .update({
          sync_status: 'error',
          error_message: error.message
        })
        .eq('id', accountId)

      throw error
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
