'use server';

import { getApi, isError } from '@/lib/oneentry';
import type { IFormsEntity, IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';

export async function getFormByMarker(marker: string, langCode?: string) {
  const result = await getApi().Forms.getFormByMarker(marker, langCode);
  if (isError(result)) {
    return { error: result.message, statusCode: result.statusCode };
  }
  const form = result as IFormsEntity;
  return {
    identifier: form.identifier,
    attributes: (form.attributes || []) as IFormAttribute[],
  };
}
