'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { googleOAuthAction } from '@/app/actions/auth';
import { GOOGLE_PROVIDER_MARKER } from '@/lib/authProviders';
import { useAuth } from '@/components/user/AuthProvider';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam || !code) {
      setError(errorParam ? 'Авторизация отменена' : 'Не получен код авторизации');
      setTimeout(() => router.push('/auth'), 2500);
      return;
    }

    (async () => {
      const result = await googleOAuthAction(code);
      if ('error' in result) {
        setError(result.error);
        setTimeout(() => router.push('/auth'), 3000);
        return;
      }
      await login(result.token.accessToken, result.token.refreshToken, GOOGLE_PROVIDER_MARKER);
      router.push('/profile');
    })();
  }, [searchParams, router, login]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <h1 className="mb-2 text-lg font-semibold text-red-700">Ошибка авторизации</h1>
            <p className="text-sm text-gray-600">{error}</p>
            <p className="mt-4 text-xs text-gray-400">Переход на страницу входа…</p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-semibold text-gray-900">Вход через Google…</h1>
            <p className="text-sm text-gray-500">Пожалуйста, подождите</p>
          </>
        )}
      </div>
    </main>
  );
}
