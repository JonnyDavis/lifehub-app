import { ForgotPasswordForm } from '@/components/forgot-password-form'

import { getNextFromSearchParams, type SearchParamsInput } from '@/lib/routing/get-next-from-search-params'

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParamsInput
}) {
  const next = await getNextFromSearchParams(searchParams)

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm next={next} />
      </div>
    </div>
  )
}
