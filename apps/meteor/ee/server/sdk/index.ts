import { proxify } from '@rocket.chat/core-services';

import type { IInstanceService } from './types/IInstanceService';

export const Instance = proxify<IInstanceService>('instance');
