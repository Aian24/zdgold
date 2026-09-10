'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

function AccountRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile') {
      router.replace('/profile');
    } else if (tab === 'orders') {
      router.replace('/orders');
    } else {
      router.replace('/layaways');
    }
  }, [router, searchParams]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center flex items-center justify-center">
      <Spinner size="lg" label="Loading your portal..." />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountRedirect />
    </Suspense>
  );
}
