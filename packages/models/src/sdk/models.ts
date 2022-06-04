import type { IIntegrationsModel } from '@rocket.chat/model-typings';

import { proxify } from './lib/models';

export const Integrations = proxify<IIntegrationsModel>('integrations');
