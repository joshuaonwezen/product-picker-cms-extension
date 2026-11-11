import type {ExtensionContext} from '@optimizely/cms-extensibility-sdk';
import {CMS_EXTENSION_FUNCTION_ID} from '@shared/constants';
import type {ActionName, ActionParams, ActionResults, Envelope} from '@shared/types';

export class CallError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = 'CallError';
    this.code = code;
  }
}

const FALLBACK_MESSAGES: Record<string, string> = {
  not_configured: 'The Product picker has no catalog yet: save the site URL in its app settings.',
  catalog_unavailable: 'The product catalog did not answer. Try again in a moment.',
  catalog_not_found: 'The site has no product catalog at /api/catalog/products.',
  internal_error: 'Something went wrong in the extension backend.',
  backend_unreachable: "The extension didn't answer. Try again in a moment; if it keeps happening, ask a CMS admin to check the app.",
};

/** Calls one backend action; resolves with its result or throws CallError. */
export async function call<A extends ActionName>(
  context: ExtensionContext,
  action: A,
  params: ActionParams[A],
): Promise<ActionResults[A]> {
  // The CMS rejects with an empty "[ExtensionService] Failed to invoke function:" when the
  // backend throws instead of answering.
  const response = await context.extension.invokeFunction(CMS_EXTENSION_FUNCTION_ID, {action, params}).catch(() => {
    throw new CallError('backend_unreachable', FALLBACK_MESSAGES.backend_unreachable);
  });
  const envelope = response.data as Envelope<ActionResults[A]> | undefined;
  if (envelope && typeof envelope === 'object' && 'ok' in envelope) {
    if (envelope.ok) return envelope.result;
    throw new CallError(envelope.error, envelope.message || FALLBACK_MESSAGES[envelope.error] || envelope.error);
  }
  throw new CallError('request_failed', `The extension backend answered HTTP ${response.statusCode}.`);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed.';
}
