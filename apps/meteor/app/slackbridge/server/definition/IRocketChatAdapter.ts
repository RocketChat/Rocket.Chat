import type { IMessage, IRegisterUser, IRoom } from '@rocket.chat/core-typings';
import type { ConversationsInfoResponse } from '@slack/web-api';

import type { SlackTS } from './IMessageSyncedWithSlack';
import type { ISlackAdapter } from './ISlackAdapter';

export type RocketChatUserIdentification = Pick<IRegisterUser, '_id' | 'username' | 'name'>;

export type SlackConversationSyncedWithRocketChat = ConversationsInfoResponse['channel'] & { rocketId?: string };

export interface IRocketChatAdapter {
	slackAdapters: ISlackAdapter[];

	connect(): void;
	disconnect(): void;

	clearSlackAdapters(): void;
	addSlack(slack: ISlackAdapter): void;
	addUser(slackUserID: string): Promise<IRegisterUser | null>;
	getChannel(slackMessage: { channel?: string }): Promise<IRoom | null>;
	findUser(slackUserID: string): Promise<IRegisterUser | null>;
	getUser(slackUser: string): Promise<IRegisterUser | null>;
	createAndSaveMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: unknown,
		rocketMsgDataDefaults: Partial<IMessage>,
		isImporting: boolean,
		slack: ISlackAdapter,
	): Promise<void>;
	createRocketID(slackChannel: string, ts: SlackTS): string;
	addChannel(slackChannelID: string, hasRetried?: boolean): Promise<IRoom | null>;
	convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt: string | undefined): Promise<string>;
	addAliasToMsg(rocketUserName: string, rocketMsgObj: Partial<IMessage>): Partial<IMessage>;
}
