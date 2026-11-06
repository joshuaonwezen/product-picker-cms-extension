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
import {ApiError} from '../lib/http';
import {catalogUrl, CatalogSettings, normalizeSiteUrl} from '../lib/settings';

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
    const next: CatalogSettings = {siteUrl};

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
