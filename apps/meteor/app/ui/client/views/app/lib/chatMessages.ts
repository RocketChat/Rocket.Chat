import type { IRoom } from '@rocket.chat/core-typings';

import type { ChatMessages } from '../../../lib/chatMessages';

export const chatMessages: Record<IRoom['_id'], ChatMessages> = {};
