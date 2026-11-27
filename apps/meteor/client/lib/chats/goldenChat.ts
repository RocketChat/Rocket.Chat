// A ChatAPI for the golden specs: the real data API over the real stores, recording fakes for the rest.
import type { IMessage } from '@rocket.chat/core-typings';

import type { ChatAPI, DataAPI } from './ChatAPI';
import type { Upload } from './Upload';
import { createDataAPI } from './data';
import { processMessageEditing } from './flows/processMessageEditing';
import { behavior, record } from './goldenFakes';
import { Messages, Rooms, Subscriptions } from '../../stores';

type ChatOptions = {
	rid?: string;
	tmid?: string;
	uid?: string | undefined;
	editingMid?: string;
	quoted?: IMessage[];
	uploads?: Upload[];
	withComposer?: boolean;
	dataOverrides?: Partial<Record<keyof DataAPI, (...args: never[]) => Promise<unknown>>>;
};

export const createGoldenChat = (options: ChatOptions = {}) => {
	const uid = 'uid' in options ? options.uid : 'uid1';
	const { rid = 'GENERAL', tmid, editingMid, quoted = [], uploads = [], withComposer = true, dataOverrides = {} } = options;
	const data = { ...createDataAPI({ rid, tmid }), ...dataOverrides };

	const recordedData = Object.fromEntries(
		Object.entries(data).map(([name, fn]) => [
			name,
			(...args: unknown[]) => {
				record(`chat.data.${name}`, ...args);
				return (fn as (...a: unknown[]) => unknown)(...args);
			},
		]),
	);

	const composer = {
		clear: () => record('chat.composer.clear'),
		setText: (...args: unknown[]) => record('chat.composer.setText', ...args),
		focus: () => record('chat.composer.focus'),
		dismissAllQuotedMessages: () => record('chat.composer.dismissAllQuotedMessages'),
		uploads: {
			get: () => {
				record('chat.composer.uploads.get');
				return uploads;
			},
			setProcessingUploads: (processing: boolean) => record('chat.composer.uploads.setProcessingUploads', processing),
			removeUpload: (id: string) => record('chat.composer.uploads.removeUpload', id),
			send: (file: unknown, encrypted?: unknown) => {
				record('chat.composer.uploads.send', file, encrypted);
				return behavior.uploadSend(file, encrypted);
			},
		},
		quotedMessages: {
			get: () => {
				record('chat.composer.quotedMessages.get');
				return quoted;
			},
		},
	};

	const chat = {
		uid,
		composer: withComposer ? composer : undefined,
		data: recordedData,
		readStateManager: { clearUnreadMark: () => record('chat.readStateManager.clearUnreadMark') },
		currentEditingMessage: {
			getMID: () => {
				record('chat.currentEditingMessage.getMID');
				return editingMid;
			},
			stop: async () => record('chat.currentEditingMessage.stop'),
			reset: async () => {
				record('chat.currentEditingMessage.reset');
				return true;
			},
		},
		action: {
			performContinuously: (...args: unknown[]) => record('chat.action.performContinuously', ...args),
		},
		ActionManager: {
			generateTriggerId: (appId: string | undefined) => {
				record('chat.ActionManager.generateTriggerId', appId);
				return appId ? `trigger-${appId}` : undefined;
			},
			notifyBusy: () => record('chat.ActionManager.notifyBusy'),
			notifyIdle: () => record('chat.ActionManager.notifyIdle'),
		},
		flows: {
			uploadFiles: async (...args: unknown[]) => record('chat.flows.uploadFiles', ...args),
			requestMessageDeletion: async (...args: unknown[]) => record('chat.flows.requestMessageDeletion', ...args),
			processMessageEditing: (...args: unknown[]) => {
				record('chat.flows.processMessageEditing', ...args);
				return processMessageEditing(chat, ...(args as [Parameters<typeof processMessageEditing>[1], string[]?]));
			},
		},
	} as unknown as ChatAPI;

	return chat;
};

// Logs each record the Messages store gains, changes or loses, in order.
export const trackMessagesStore = (): (() => void) =>
	Messages.useStore.subscribe((state, previous) => {
		for (const [id, message] of state.records) {
			if (previous.records.get(id) !== message) {
				record('Messages.store', message);
			}
		}
		for (const id of previous.records.keys()) {
			if (!state.records.has(id)) {
				record('Messages.delete', id);
			}
		}
	});

export const resetStores = (): void => {
	Messages.useStore.setState({ records: new Map() });
	Rooms.useStore.setState({ records: new Map() });
	Subscriptions.useStore.setState({ records: new Map() });
};
