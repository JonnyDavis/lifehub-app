import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getNextFromSearchParams, type SearchParamsInput } from '@/lib/routing/get-next-from-search-params'
import { createClient } from '@/lib/supabase/server'

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParamsInput
}) {
  const next = await getNextFromSearchParams(searchParams)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (!error && data?.claims) {
    redirect(next ?? '/dashboard')
  }

  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to confirm your account
                before signing in.
              </p>
              <div className="mt-4 text-sm">
                <Link href={loginHref} className="underline underline-offset-4">
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
