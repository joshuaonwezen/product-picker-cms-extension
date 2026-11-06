import * as App from '@zaiusinc/app-sdk';
import {logger} from '@zaiusinc/app-sdk';

import type {ActionParams, Envelope, FieldResult} from '../../shared/types';
import {CmsClient} from '../lib/cms';
import {fieldMode} from '../lib/field';
import {ApiError} from '../lib/http';
import {loadConfig} from '../lib/settings';

interface RequestBody {
  action?: unknown;
  params?: Partial<ActionParams['field']>;
}

function ok<T>(result: T): Envelope<T> {
  return {ok: true, result};
}

function fail(error: string, message?: string): Envelope<never> {
  return message ? {ok: false, error, message} : {ok: false, error};
}

const PLAIN: FieldResult = {mode: 'text', contentType: null};

// The CMS doesn't say which property (or which inline element) the editor is on, and
// PropertyState.settings arrives as {}. Log what the iframe does get, once per container: if
// any of it ever names the field, the picker can target it exactly instead of guessing.
let diagnosticsLogged = false;

export class CmsUiExtension extends App.Function {
  public async perform(): Promise<App.Response> {
    const body = (this.request.bodyJSON ?? {}) as RequestBody;
    const action = typeof body.action === 'string' ? body.action : '';
    if (action !== 'field') return new App.Response(400, fail('unknown_action', action));

    if (!diagnosticsLogged) {
      diagnosticsLogged = true;
      logger.info(
        'What the CMS gives the editor',
        JSON.stringify({settings: body.params?.settings ?? null, ...(body.params?.diagnostics ?? {})}),
      );
    }

    // Everything inside the try: a throw that escapes perform() reaches the editor as an
    // empty "[ExtensionService] Failed to invoke function:".
    try {
      const config = await loadConfig();
      // Until both settings sections are saved, every field stays a plain text field.
      if (!config) return new App.Response(200, ok(PLAIN));
      const value = typeof body.params?.value === 'string' ? body.params.value : '';
      const result = await fieldMode(config, new CmsClient(config.cms), body.params?.content, value);
      return new App.Response(200, ok(result));
    } catch (error) {
      if (error instanceof ApiError) {
        logger.warn('Upstream API error', error.code, error.message);
        return new App.Response(502, fail(error.code, error.message));
      }
      logger.error('CmsUiExtension failure', action, error);
      return new App.Response(500, fail('internal_error'));
    }
  }
}
