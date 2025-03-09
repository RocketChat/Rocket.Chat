import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { SlackTS } from './IMessageSyncedWithSlack';
import type { RocketChatUserIdentification } from './IRocketChatAdapter';
import type { ISlackAPI } from './ISlackAPI';
import type { RocketChatMessageData } from './RocketChatMessageData';
import type { SlackMessageEvent } from './SlackMessageEvent';

export type SlackAppCredentials = {
	botToken: string;
	appToken: string;
	signingSecret: string;
};

export type SlackChannel = {
	id: string;
	family: 'channels' | 'groups';
};

export interface ISlackAdapter {
	slackAPI: ISlackAPI;

	connect(params: { apiToken?: string; appCredential?: SlackAppCredentials }): Promise<void>;
	connectApp(appCredential: SlackAppCredentials): Promise<unknown>;
	connectLegacy(apiToken: string): Promise<unknown>;
	disconnect(): Promise<void>;

	registerForEvents(): void;

	getSlackChannel(rocketChatChannelId: string): SlackChannel | undefined;
	postDeleteMessage(message: IMessage): Promise<void>;

	getTimeStamp(message: IMessage): SlackTS | undefined;
	postReactionAdded(reaction: string, slackChannel: SlackChannel['id'], slackTS: SlackTS | undefined): Promise<void>;
	postReactionRemove(reaction: string, slackChannel: SlackChannel['id'], slackTS: SlackTS | undefined): Promise<void>;
	postMessage(slackChannel: SlackChannel | undefined, rocketMessage: IMessage): Promise<void>;
	postMessageUpdate(slackChannel: SlackChannel | undefined, rocketMessage: IMessage): Promise<void>;

	addSlackChannel(rocketChID: string, slackChID: SlackChannel['id']): void;

	processSubtypedMessage(
		rocketChannel: IRoom,
		rocketUser: RocketChatUserIdentification,
		slackMessage: SlackMessageEvent,
		isImporting: boolean,
	): Promise<RocketChatMessageData | void>;
}
