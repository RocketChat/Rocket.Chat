import type { IMessage, IRegisterUser, IRoom, IUser } from '@rocket.chat/core-typings';

import type { ISlackAdapter, SlackTS } from './ISlackAdapter';

export type RocketChatUserIdentification = Pick<IRegisterUser, '_id' | 'username' | 'name'>;

export interface IRocketChatAdapter {
	slackAdapters: ISlackAdapter[];

	connect(): void;
	disconnect(): void;

	clearSlackAdapters(): void;
	addSlack(slack: ISlackAdapter): void;
	getChannel(slackMessage: { channel?: string }): Promise<IRoom | null>;
	getUser(slackUser: string): Promise<IUser | null>;
	createAndSaveMessage(
		rocketChannel: IRoom,
		rocketUser: RocketChatUserIdentification,
		slackMessage: unknown,
		rocketMsgDataDefaults: Partial<IMessage>,
		isImporting: boolean,
		slack: ISlackAdapter,
	): Promise<void>;
	createRocketID(slackChannel: string, ts: SlackTS): string;
}
