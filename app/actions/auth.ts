'use server';

import { getApi, isError } from '@/lib/oneentry';
import type { IAuthProvidersEntity } from 'oneentry/dist/auth-provider/authProvidersInterfaces';

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
