import type { IVoipRoom, IMessage } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

export type FindVoipRoomsParams = {
	agents?: string[];
	open?: boolean;
	createdAt?: { start?: string; end?: string };
	closedAt?: { start?: string; end?: string };
	tags?: string[];
	queue?: string;
	visitorId?: string;
	options?: {
		sort?: FindOptions<IVoipRoom>['sort'];
		count?: number;
		fields?: Record<string, unknown>;
		offset?: number;
	};
	direction?: IVoipRoom['direction'];
	roomName?: string;
};

export type IOmniRoomClosingMessage = Pick<IMessage, 't' | 'groupable'> & Partial<Pick<IMessage, 'msg'>>;
