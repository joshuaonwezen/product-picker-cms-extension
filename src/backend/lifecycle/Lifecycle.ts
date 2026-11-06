import {
  AuthorizationGrantResult,
  CanUninstallResult,
  Lifecycle as AppLifecycle,
  LifecycleResult,
  LifecycleSettingsResult,
  logger,
  storage,
  SubmittedFormData,
  Request as AppRequest,
} from '@zaiusinc/app-sdk';

import {fetchCatalog, toOptions} from '../lib/catalog';
import {CmsClient} from '../lib/cms';
import {ApiError} from '../lib/http';
import {catalogUrl, CatalogSettings, CmsSettings, normalizeSiteUrl, readSection} from '../lib/settings';

function text(formData: SubmittedFormData, key: string): string {
  const value = formData[key];
  return typeof value === 'string' ? value.trim() : '';
}

export class Lifecycle extends AppLifecycle {
  public async onInstall(): Promise<LifecycleResult> {
    return {success: true};
  }

  public async onUpgrade(_fromVersion: string): Promise<LifecycleResult> {
    return {success: true};
  }

  public async onFinalizeUpgrade(_fromVersion: string): Promise<LifecycleResult> {
    return {success: true};
  }

  public async onAfterUpgrade(): Promise<LifecycleResult> {
    return {success: true};
  }

  public async canUninstall(): Promise<CanUninstallResult> {
    return {uninstallable: true};
  }

  public async onUninstall(): Promise<LifecycleResult> {
    return {success: true};
  }

  public async onSettingsForm(
    section: string,
    action: string,
    formData: SubmittedFormData,
  ): Promise<LifecycleSettingsResult> {
    const result = new LifecycleSettingsResult();
    try {
      if (section === 'catalog' && action === 'saveCatalog') return await this.saveCatalog(formData, result);
      if (section === 'cms' && action === 'saveCms') return await this.saveCms(formData, result);
    } catch (error) {
      logger.error('Settings save failed', error);
      return result.addToast('danger', 'Could not save settings. Try again.');
    }
    logger.warn('Unsupported section-action combination:', section, action);
    return result;
  }

  // Proves the URL by reading the catalog the picker will list.
  private async saveCatalog(formData: SubmittedFormData, result: LifecycleSettingsResult) {
    const siteUrl = normalizeSiteUrl(text(formData, 'siteUrl'));
    if (!siteUrl) return result.addError('siteUrl', 'A full URL, e.g. https://optimizely-onboarding.vercel.app.');
    const next: CatalogSettings = {siteUrl, contentTypes: text(formData, 'contentTypes')};

    try {
      const products = toOptions(await fetchCatalog(catalogUrl(siteUrl), 0));
      if (products.length === 0) {
        return result.addError('siteUrl', 'The catalog answered but lists no products.');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return result
          .addError('siteUrl', `${catalogUrl(siteUrl)} answered HTTP ${error.status}.`)
          .addToast('danger', 'No product catalog at that site.');
      }
      throw error;
    }

    await storage.settings.put('catalog', {...next});
    return result.addToast('success', 'Product catalog saved.');
  }

  private async saveCms(formData: SubmittedFormData, result: LifecycleSettingsResult) {
    const previous = await readSection<CmsSettings>('cms');
    const next: CmsSettings = {
      clientId: text(formData, 'clientId'),
      // A secret field comes back blank when the editor didn't retype it - keep the stored one.
      clientSecret: text(formData, 'clientSecret') || previous.clientSecret || '',
    };
    if (!next.clientId) return result.addError('clientId', 'Required.');
    if (!next.clientSecret) return result.addError('clientSecret', 'Required.');

    try {
      await new CmsClient({clientId: next.clientId, clientSecret: next.clientSecret}).token();
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        return result
          .addError('clientSecret', 'The CMS rejected this client ID / secret.')
          .addToast('danger', 'The CMS rejected the API client credentials.');
      }
      throw error;
    }

    await storage.settings.put('cms', {...next});
    return result.addToast('success', 'CMS API client saved.');
  }

  public async onAuthorizationRequest(
    _section: string,
    _formData: SubmittedFormData,
  ): Promise<LifecycleSettingsResult> {
    return new LifecycleSettingsResult().addToast('danger', 'OAuth is not supported.');
  }

  public async onAuthorizationGrant(_request: AppRequest): Promise<AuthorizationGrantResult> {
    return new AuthorizationGrantResult('').addToast('danger', 'OAuth is not supported.');
  }
}
