import { getAuthProviders } from '@/app/actions/auth';
import { AuthForm } from '@/components/user/AuthForm';

const AUTH_PROVIDER_MARKER = 'email';

export default async function AuthPage() {
  const result = await getAuthProviders();

  if ('error' in result) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Ошибка загрузки провайдеров: {String(result.error)}
        </div>
      </main>
    );
  }

  const provider = result.providers.find((p) => p.identifier === AUTH_PROVIDER_MARKER);

  if (!provider || !provider.formIdentifier) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          Провайдер авторизации &laquo;{AUTH_PROVIDER_MARKER}&raquo; не настроен: нет привязанной формы или провайдер отсутствует в проекте OneEntry.
        </div>
      </main>
    );
  }

  const cooldownSec = Number(provider.config?.systemCodeTlsSec) || 80;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <AuthForm
          authProviderMarker={provider.identifier}
          formIdentifier={provider.formIdentifier}
          isCheckCode={provider.isCheckCode}
          cooldownSec={cooldownSec}
        />
      </div>
    </main>
  );
}
