import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { getSafeNextFromOrigin } from '@/lib/routing/get-safe-next'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = getSafeNextFromOrigin(_next, request.nextUrl.origin) ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    // Email confirmation links are expected to land here first. On success,
    // Supabase should establish the browser session before we continue into the
    // in-app destination carried in `next` (for example `/dashboard` or an
    // invite-join URL).
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    } else {
      // Confirmation links are one-time use and may be retried by browsers/mail
      // clients. If verification fails, send the user somewhere recoverable
      // instead of leaving them on a dead-end technical error page.
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('confirmation', 'failed')
      if (next !== '/') {
        loginUrl.searchParams.set('next', next)
      }
      redirect(loginUrl.toString())
    }
  }

  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('confirmation', 'failed')
  if (next !== '/') {
    loginUrl.searchParams.set('next', next)
  }
  redirect(loginUrl.toString())
}
