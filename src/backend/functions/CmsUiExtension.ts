import * as App from '@zaiusinc/app-sdk';
import {logger} from '@zaiusinc/app-sdk';

import type {CatalogResult, Envelope} from '../../shared/types';
import {fetchCatalog, toOptions} from '../lib/catalog';
import {ApiError} from '../lib/http';
import {loadCatalogUrl} from '../lib/settings';

interface RequestBody {
  action?: unknown;
}

function ok<T>(result: T): Envelope<T> {
  return {ok: true, result};
}

function fail(error: string, message?: string): Envelope<never> {
  return message ? {ok: false, error, message} : {ok: false, error};
}

export class CmsUiExtension extends App.Function {
  public async perform(): Promise<App.Response> {
    const body = (this.request.bodyJSON ?? {}) as RequestBody;
    const action = typeof body.action === 'string' ? body.action : '';
    if (action !== 'catalog') return new App.Response(400, fail('unknown_action', action));

    // Everything inside the try: a throw that escapes perform() reaches the editor as an
    // empty "[ExtensionService] Failed to invoke function:".
    try {
      const url = await loadCatalogUrl();
      if (!url) return new App.Response(200, fail('not_configured'));
      const catalog = await fetchCatalog(url);
      const result: CatalogResult = {updatedAt: catalog.updatedAt ?? '', options: toOptions(catalog)};
      return new App.Response(200, ok(result));
    } catch (error) {
      if (error instanceof ApiError) {
        logger.warn('Catalog API error', error.code, error.message);
        return new App.Response(502, fail(error.code, error.message));
      }
      logger.error('CmsUiExtension failure', action, error);
      return new App.Response(500, fail('internal_error'));
    }
  }
}
