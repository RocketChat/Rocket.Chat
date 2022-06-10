import { IMessage } from '@rocket.chat/core-typings';

export type FindVoipRoomsParams = {
	agents?: string[];
	open?: boolean;
	createdAt?: { start?: string; end?: string };
	closedAt?: { start?: string; end?: string };
	tags?: string[];
	queue?: string;
	visitorId?: string;
	options?: {
		sort?: Record<string, unknown>;
		count?: number;
		fields?: Record<string, unknown>;
		offset?: number;
	};
};

export type IOmniRoomClosingMessage = Pick<IMessage, 't' | 'groupable'> & Partial<Pick<IMessage, 'msg'>>;
