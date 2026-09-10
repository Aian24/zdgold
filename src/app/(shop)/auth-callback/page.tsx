'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useSettings } from '@/lib/store';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginCustom } = useAuth();
  const { settings } = useSettings();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [statusText, setStatusText] = useState('Verifying your Google session...');
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    try {
      const sessionRaw = searchParams.get('session');
      const target = searchParams.get('target') || '/account';

      if (!sessionRaw) {
        setStatus('error');
        setStatusText('No authentication payload received.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const user = JSON.parse(sessionRaw);
      if (user && user.email) {
        loginCustom(user);
        setStatus('success');
        setStatusText(`Welcome, ${user.name.split(' ')[0]}! Redirecting you now...`);

        setTimeout(() => {
          router.push(target);
        }, 800);
      } else {
        throw new Error('Invalid user payload format');
      }
    } catch (e: any) {
      console.error('Auth callback processing error:', e);
      setStatus('error');
      setStatusText(e.message || 'Authentication synchronization failed.');
      setTimeout(() => router.push('/login'), 2500);
    }
  }, [searchParams, router, loginCustom]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-gold-500/30 p-8 shadow-xl text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-14 h-14 rounded-full bg-gold-50 border border-gold-300 flex items-center justify-center mx-auto text-gold-600">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Authenticating</h2>
            <p className="text-xs text-neutral-500">{statusText}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Signed In Successfully</h2>
            <p className="text-xs text-emerald-700 font-medium">{statusText}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-300 flex items-center justify-center mx-auto text-red-600 animate-in zoom-in">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">Authentication Failed</h2>
            <p className="text-xs text-red-600">{statusText}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-neutral-200 p-8 shadow text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-gold-600 mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">Synchronizing session...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
