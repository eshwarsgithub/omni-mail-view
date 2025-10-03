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

    const { accountId, to, cc, bcc, subject, bodyText, bodyHtml, draftId } = await req.json()

    // Get account details
    const { data: account } = await supabaseClient
      .from('mail_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (!account) {
      throw new Error('Account not found')
    }

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

    // Build email message in RFC 2822 format
    const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9)

    let email = [
      `From: ${account.email}`,
      `To: ${to.join(', ')}`,
    ]

    if (cc && cc.length > 0) {
      email.push(`Cc: ${cc.join(', ')}`)
    }

    if (bcc && bcc.length > 0) {
      email.push(`Bcc: ${bcc.join(', ')}`)
    }

    email.push(
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      bodyText || '',
    )

    if (bodyHtml) {
      email.push(
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        bodyHtml,
      )
    }

    email.push(`--${boundary}--`)

    const rawEmail = email.join('\r\n')
    const encodedEmail = btoa(rawEmail).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    // Send via Gmail API
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    })

    const sendData = await sendResponse.json()

    if (sendData.error) {
      throw new Error(sendData.error.message || 'Failed to send email')
    }

    // If this was a draft, mark it as sent
    if (draftId) {
      await supabaseClient
        .from('drafts')
        .update({
          is_sent: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: sendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
