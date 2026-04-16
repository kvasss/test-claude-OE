'use server';

import { getApi, isError } from '@/lib/oneentry';
import { GOOGLE_PROVIDER_MARKER } from '@/lib/authProviders';
import type {
  IAuthEntity,
  IAuthProvidersEntity,
} from 'oneentry/dist/auth-provider/authProvidersInterfaces';

export async function getAuthProviders() {
  const providers = await getApi().AuthProvider.getAuthProviders();
  if (isError(providers)) {
    return { error: providers.message, statusCode: providers.statusCode };
  }
  return { providers: providers as IAuthProvidersEntity[] };
}

export async function logout(authProviderMarker: string, token: string) {
  const result = await getApi().AuthProvider.logout(authProviderMarker, token);
  if (isError(result)) {
    return { error: result.message, statusCode: result.statusCode };
  }
  return { success: true };
}

export async function googleOAuthAction(code: string) {
  const result = await getApi().AuthProvider.oauth(GOOGLE_PROVIDER_MARKER, {
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (isError(result)) {
    const msg = Array.isArray(result.message) ? result.message.join('; ') : String(result.message);
    return { error: msg, statusCode: result.statusCode };
  }
  return { token: result as IAuthEntity };
}
