import type { IScheduledMessage } from '@rocket.chat/core-typings';

import type { ScheduledMessageCreateProps } from './ScheduledMessageCreateProps';
import type { ScheduledMessageDeleteProps } from './ScheduledMessageDeleteProps';
import type { ScheduledMessageListProps } from './ScheduledMessageListProps';
import type { ScheduledMessageUpdateProps } from './ScheduledMessageUpdateProps';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

export * from './ScheduledMessageCreateProps';
export * from './ScheduledMessageDeleteProps';
export * from './ScheduledMessageListProps';
export * from './ScheduledMessageUpdateProps';

export type ScheduledMessagesEndpoints = {
	'/v1/chat.scheduleMessage': {
		POST: (params: ScheduledMessageCreateProps) => { scheduledMessage: IScheduledMessage };
	};

	'/v1/chat.getScheduledMessages': {
		GET: (params: ScheduledMessageListProps) => PaginatedResult<{ messages: IScheduledMessage[] }>;
	};

	'/v1/chat.updateScheduledMessage': {
		POST: (params: ScheduledMessageUpdateProps) => { scheduledMessage: IScheduledMessage };
	};

	'/v1/chat.deleteScheduledMessage': {
		POST: (params: ScheduledMessageDeleteProps) => void;
	};
};
