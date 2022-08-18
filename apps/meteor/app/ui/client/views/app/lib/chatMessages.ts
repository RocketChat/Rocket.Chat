import type { IRoom } from '@rocket.chat/core-typings';

import type { ChatMessages } from '../../../lib/ChatMessages';

export const chatMessages: Record<IRoom['_id'], ChatMessages> = {};
