import { SignUpForm } from '@/components/sign-up-form'
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
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (!error && data?.claims && !userError && userData.user) {
    redirect(next ?? '/dashboard')
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm next={next} />
      </div>
    </div>
  )
}
