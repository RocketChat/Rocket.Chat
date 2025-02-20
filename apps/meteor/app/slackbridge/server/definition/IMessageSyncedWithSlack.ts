import type { IMessage } from '@rocket.chat/core-typings';

export type SlackTS = string;

export type IMessageSyncedWithSlack = IMessage & { slackTs?: SlackTS; updatedBySlack?: boolean };

export type IMessageImportedFromSlack = IMessage & { _id: `slack-${string}-${string}-${string}` };

export const isMessageSyncedWithSlack = (message: IMessage): message is IMessageSyncedWithSlack =>
	'slackTs' in message || 'updatedBySlack' in message;

export const isMessageImportedFromSlack = (message: IMessage): message is IMessageImportedFromSlack => message._id.startsWith('slack-');
