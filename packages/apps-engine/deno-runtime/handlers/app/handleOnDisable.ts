import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export default async function handleOnDisable(): Promise<boolean> {
  const app = AppObjectRegistry.get<App>('app');

  if (typeof app?.onDisable !== 'function') {
    throw new Error('App must contain an onDisable function', {
      cause: 'invalid_app',
    });
  }

  await app.onDisable(AppAccessorsInstance.getConfigurationModify());

  return true;
}

