'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { getApi, isError } from '@/lib/oneentry';
import { GOOGLE_PROVIDER_MARKER } from '@/lib/authProviders';
import { getFormByMarker } from '@/app/actions/forms';
import { useAuth } from './AuthProvider';
import type {
  IAuthEntity,
  IAuthPostBody,
  IAuthProvidersEntity,
  ISignUpData,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

const EVENT_REGISTRATION = 'user_registration';

type Mode = 'signin' | 'signup' | 'verify';

type AuthFormProps = {
  authProviderMarker: string;
  formIdentifier: string;
  isCheckCode: boolean;
  cooldownSec: number;
  redirectTo?: string;
};

function inputTypeFor(field: IFormAttribute): string {
  if (field.isPassword) return 'password';
  if (field.isLogin || field.isNotificationEmail) return 'email';
  if (field.isNotificationPhonePush || field.isNotificationPhoneSMS) return 'tel';
  const m = field.marker.toLowerCase();
  if (m.includes('email') || m.includes('login')) return 'email';
  if (m.includes('phone')) return 'tel';
  return 'text';
}

function placeholderFor(field: IFormAttribute): string {
  return (field.additionalFields?.placeholder?.value as string | undefined) ?? '';
}

function titleFor(field: IFormAttribute): string {
  return field.localizeInfos?.title ?? field.marker;
}

function isPureNotification(f: IFormAttribute) {
  const isNotif = f.isNotificationEmail || f.isNotificationPhonePush || f.isNotificationPhoneSMS;
  return isNotif && !f.isLogin && !f.isPassword && !f.isSignUp && !f.isSignUpRequired;
}

export function AuthForm({
  authProviderMarker,
  formIdentifier,
  isCheckCode,
  cooldownSec,
  redirectTo = '/profile',
}: AuthFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [fields, setFields] = useState<IFormAttribute[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFormByMarker(formIdentifier).then((result) => {
      if (cancelled) return;
      if ('error' in result) {
        setError(String(result.error));
        setFormLoading(false);
        return;
      }
      setFields(result.attributes);
      setFormLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [formIdentifier]);

  const startCooldown = useCallback((seconds: number) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const getLoginValue = () => {
    const loginField = fields.find((f) => f.isLogin);
    return loginField ? values[loginField.marker]?.trim() || '' : '';
  };

  const getNotificationEmail = () => {
    const emailField = fields.find((f) => f.isNotificationEmail);
    return (emailField && values[emailField.marker]?.trim()) || getLoginValue();
  };

  const getPhonePush = () => {
    const field = fields.find((f) => f.isNotificationPhonePush);
    const v = field && values[field.marker]?.trim();
    return v ? [v] : [];
  };

  const buildAuthData = (): IAuthPostBody['authData'] =>
    fields
      .filter((f) => (f.isLogin || f.isPassword) && values[f.marker]?.trim())
      .map((f) => ({ marker: f.marker, value: values[f.marker] }));

  const buildFormData = (): ISignUpData['formData'] =>
    fields
      .filter((f) => !f.isLogin && !f.isPassword && values[f.marker]?.trim())
      .map((f) => ({ marker: f.marker, type: f.type as string, value: values[f.marker] }));

  const visibleFields = (): IFormAttribute[] => {
    if (mode === 'signup') {
      return fields.filter(
        (f) => !isPureNotification(f) || f.isSignUp || f.isSignUpRequired,
      );
    }
    return fields.filter((f) => f.isLogin || f.isPassword);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    const result = await getApi().AuthProvider.generateCode(
      authProviderMarker,
      verifyEmail,
      EVENT_REGISTRATION,
    );
    if (isError(result)) {
      setError(String(result.message) || 'Resend failed');
      return;
    }
    setSuccess('Код отправлен повторно');
    startCooldown(cooldownSec);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await getApi().AuthProvider.auth(authProviderMarker, {
          authData: buildAuthData(),
        });
        if (isError(result)) {
          setError(Array.isArray(result.message) ? result.message.join('; ') : String(result.message));
          return;
        }
        const auth = result as IAuthEntity;
        await login(auth.accessToken, auth.refreshToken, authProviderMarker);
        setSuccess('Вход выполнен');
        router.push(redirectTo);
        return;
      }

      if (mode === 'signup') {
        const signUpBody: ISignUpData = {
          formIdentifier,
          authData: buildAuthData(),
          formData: buildFormData(),
          notificationData: {
            email: getNotificationEmail(),
            phonePush: getPhonePush(),
          } as ISignUpData['notificationData'],
        };
        const result = await getApi().AuthProvider.signUp(authProviderMarker, signUpBody);
        if (isError(result)) {
          setError(Array.isArray(result.message) ? result.message.join('; ') : String(result.message));
          return;
        }
        if (isCheckCode) {
          setVerifyEmail(getLoginValue());
          setSuccess('Аккаунт создан. Введите код из письма.');
          startCooldown(cooldownSec);
          setMode('verify');
        } else {
          setSuccess('Аккаунт создан. Войдите.');
          setMode('signin');
        }
        return;
      }

      if (mode === 'verify') {
        const result = await getApi().AuthProvider.activateUser(
          authProviderMarker,
          verifyEmail,
          verifyCode,
        );
        if (isError(result)) {
          setError(String(result.message) || 'Неверный код');
          return;
        }
        setSuccess('Аккаунт активирован. Войдите.');
        setVerifyCode('');
        setMode('signin');
        return;
      }
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    const provider = await getApi().AuthProvider.getAuthProviderByMarker(GOOGLE_PROVIDER_MARKER);
    if (isError(provider)) {
      setError(`Провайдер Google недоступен: ${String(provider.message)}`);
      return;
    }
    const baseUrl = (provider as IAuthProvidersEntity).config?.oauthAuthUrl;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl || !clientId || !appUrl) {
      setError('OAuth не настроен: отсутствует oauthAuthUrl / CLIENT_ID / APP_URL');
      return;
    }
    const redirectUri = `${appUrl}/auth/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    window.location.href = `${baseUrl}?${params.toString()}`;
  };

  if (formLoading) {
    return <div className="text-center text-gray-500">Загрузка формы…</div>;
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
  const btnPrimary =
    'w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition';
  const btnLink = 'text-sm text-indigo-600 hover:text-indigo-800 hover:underline';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {mode === 'signin' && 'Вход'}
          {mode === 'signup' && 'Регистрация'}
          {mode === 'verify' && 'Подтверждение email'}
        </h1>
        {mode !== 'verify' && (
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccess('');
              }}
              className={mode === 'signin' ? 'font-semibold text-indigo-600' : btnLink}
            >
              Вход
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccess('');
              }}
              className={mode === 'signup' ? 'font-semibold text-indigo-600' : btnLink}
            >
              Регистрация
            </button>
          </div>
        )}
      </div>

      {mode === 'verify' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Код отправлен на <span className="font-medium text-gray-900">{verifyEmail}</span>
          </p>
          <div>
            <label htmlFor="verify-code" className="mb-1 block text-sm font-medium text-gray-700">
              Код из письма
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            className="text-sm text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Отправить код снова через ${resendCooldown} с` : 'Отправить код снова'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFields().map((field) => {
            const isRequired = mode === 'signup'
              ? field.isSignUpRequired || field.isLogin || field.isPassword
              : true;
            return (
              <div key={field.marker}>
                <label
                  htmlFor={field.marker}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {titleFor(field)}
                  {isRequired && <span className="ml-1 text-red-500">*</span>}
                </label>
                <input
                  id={field.marker}
                  name={field.marker}
                  type={inputTypeFor(field)}
                  autoComplete={
                    field.isPassword ? (mode === 'signup' ? 'new-password' : 'current-password') : 'off'
                  }
                  placeholder={placeholderFor(field)}
                  value={values[field.marker] || ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.marker]: e.target.value }))
                  }
                  required={isRequired}
                  className={inputCls}
                />
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading
          ? 'Загрузка…'
          : mode === 'signin'
          ? 'Войти'
          : mode === 'signup'
          ? 'Создать аккаунт'
          : 'Подтвердить'}
      </button>

      {mode !== 'verify' && (
        <>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs uppercase tracking-wide text-gray-400">или</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Войти через Google
          </button>
        </>
      )}

      {mode === 'verify' && (
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setError('');
            setSuccess('');
          }}
          className={`${btnLink} block text-center w-full`}
        >
          Назад к регистрации
        </button>
      )}
    </form>
  );
}
