'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApi, isError } from '@/lib/oneentry';
import { getFormByMarker } from '@/app/actions/forms';
import { useAuth } from '@/components/user/AuthProvider';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { FormDataType } from 'oneentry/dist/forms-data/formsDataInterfaces';

function hasMarker(item: FormDataType): item is FormDataType & { marker: string; value: unknown } {
  return typeof item === 'object' && item !== null && 'marker' in item && typeof (item as { marker?: unknown }).marker === 'string';
}

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

export default function ProfilePage() {
  const router = useRouter();
  const { isAuth, loading: authLoading, user, refreshUser } = useAuth();

  const [fields, setFields] = useState<IFormAttribute[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loadingForm, setLoadingForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuth) {
      router.replace('/auth');
    }
  }, [authLoading, isAuth, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getFormByMarker(user.formIdentifier).then((result) => {
      if (cancelled) return;
      if ('error' in result) {
        setError(String(result.error));
        setLoadingForm(false);
        return;
      }
      setFields(result.attributes);

      const initial: Record<string, string> = {};
      const currentFormData: FormDataType[] = Array.isArray(user.formData) ? user.formData : [];
      for (const item of currentFormData) {
        if (!hasMarker(item)) continue;
        initial[item.marker] = item.value == null ? '' : String(item.value);
      }
      setValues(initial);
      setLoadingForm(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const userEmail = useMemo(() => {
    if (!user) return '';
    const data: FormDataType[] = Array.isArray(user.formData) ? user.formData : [];
    for (const item of data) {
      if (!hasMarker(item)) continue;
      const m = item.marker.toLowerCase();
      if (item.marker === 'email_reg' || m.includes('email') || m.includes('login')) {
        return item.value == null ? '' : String(item.value);
      }
    }
    return '';
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const formData: Array<{ marker: string; type: string; value: string }> = [];
      const authData: Array<{ marker: string; value: string }> = [];

      for (const field of fields) {
        const value = values[field.marker] ?? '';
        if (field.isPassword) {
          if (value.trim()) authData.push({ marker: field.marker, value });
        } else {
          formData.push({ marker: field.marker, type: field.type as string, value });
        }
      }

      const body = {
        formIdentifier: user.formIdentifier,
        formData,
        state: user.state,
        ...(authData.length > 0 ? { authData } : {}),
      };

      const result = await getApi().Users.updateUser(body);
      if (isError(result)) {
        setError(Array.isArray(result.message) ? result.message.join('; ') : String(result.message));
        return;
      }

      setSuccess('Профиль сохранён');
      setValues((prev) => {
        const next = { ...prev };
        for (const f of fields) if (f.isPassword) next[f.marker] = '';
        return next;
      });
      await refreshUser();
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (isAuth && loadingForm)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Загрузка…</div>
      </main>
    );
  }

  if (!isAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="mb-4 text-gray-700">Войдите, чтобы открыть личный кабинет</p>
          <Link
            href="/auth"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Войти
          </Link>
        </div>
      </main>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

  const sortedFields = [...fields].sort((a, b) => a.position - b.position);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Личный кабинет</h1>
        {userEmail && <p className="mt-1 text-sm text-gray-500">{userEmail}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {sortedFields.map((field) => {
          const isPassword = field.isPassword;
          return (
            <div key={field.marker}>
              <label htmlFor={field.marker} className="mb-1 block text-sm font-medium text-gray-700">
                {titleFor(field)}
                {isPassword && <span className="ml-2 text-xs text-gray-400">(оставьте пустым, чтобы не менять)</span>}
              </label>
              <input
                id={field.marker}
                name={field.marker}
                type={inputTypeFor(field)}
                autoComplete={isPassword ? 'new-password' : field.marker}
                placeholder={placeholderFor(field)}
                value={values[field.marker] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.marker]: e.target.value }))}
                className={inputCls}
              />
            </div>
          );
        })}

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </form>
    </main>
  );
}
