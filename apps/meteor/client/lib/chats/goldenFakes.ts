// Recording fakes shared by the golden (characterization) specs of the send, upload and typing flows.
// Every fake appends `[name, ...args]` to one ordered log, so a spec asserts the exact call sequence.
import type { IMessage } from '@rocket.chat/core-typings';

export type Call = [fn: string, ...args: unknown[]];

const calls: Call[] = [];

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

// Copies what a call received, so a later mutation of the same object does not rewrite the log.
export const snapshot = (value: unknown): unknown => {
	if (typeof value === 'function') {
		return `[Function ${value.name || 'anonymous'}]`;
	}
	if (Array.isArray(value)) {
		return value.map(snapshot);
	}
	if (isPlainObject(value)) {
		return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, snapshot(entry)]));
	}
	return value;
};

export const record = (fn: string, ...args: unknown[]): void => {
	calls.push([fn, ...args.map(snapshot)]);
};

export const getCalls = (): Call[] => [...calls];

export const clearCalls = (): void => {
	calls.length = 0;
};

export const NOW = new Date('2026-11-27T10:00:00.000Z');

type PostHandler = (endpoint: string, params: unknown) => Promise<unknown>;

export const defaults = () => ({
	settings: {
		Message_MaxAllowedSize: 5000,
		FileUpload_Enabled: true,
		Message_AllowConvertLongMessagesToAttachment: true,
		Message_AllowUnrecognizedSlashCommand: false,
		Message_Read_Receipt_Enabled: false,
		FileUpload_MaxFileSize: -1,
		UI_Use_Real_Name: false,
	} as Record<string, unknown>,
	userId: 'uid1' as string | undefined,
	user: { _id: 'uid1', username: 'john.doe', name: 'John Doe' } as { _id: string; username?: string; name?: string } | undefined,
	post: (async () => ({})) as PostHandler,
	get: (async () => ({})) as PostHandler,
	beforeSendMessage: (async (message: IMessage) => message) as (message: IMessage) => Promise<IMessage>,
	permissions: [] as string[],
	emojis: {} as Record<string, unknown>,
	commands: {} as Record<string, unknown>,
	readOnly: false,
	triggerId: undefined as string | undefined,
	permaLinks: {} as Record<string, string>,
	uploadSend: (async () => undefined) as (file: unknown, encrypted?: unknown) => Promise<void>,
	permaLinkError: undefined as Error | undefined,
	e2eRoom: undefined as unknown,
	callbackResult: undefined as unknown,
});

export const behavior = defaults();

export const resetFakes = (): void => {
	calls.length = 0;
	Object.assign(behavior, defaults());
};

export type FakeXhr = {
	readyState: number;
	DONE: number;
	status: number;
	responseText: string;
	onload: (() => void) | null;
	abort: () => void;
};

export type UploadEvents = { load: (event: unknown) => void; progress: (event: unknown) => void; error: (event: unknown) => void };

export const upload: { xhr: FakeXhr; events: UploadEvents | undefined } = {
	xhr: undefined as unknown as FakeXhr,
	events: undefined,
};

export const newXhr = (): FakeXhr => ({
	readyState: 4,
	DONE: 4,
	status: 0,
	responseText: '',
	onload: null,
	abort: () => record('xhr.abort'),
});

export const streams: { handler: ((...args: unknown[]) => void) | undefined } = { handler: undefined };

export const sdkModule = {
	sdk: {
		publish: (...args: unknown[]) => record('sdk.publish', ...args),
		stream: (name: string, params: unknown, handler: (...args: unknown[]) => void) => {
			record('sdk.stream', name, params);
			streams.handler = handler;
			return { stop: () => record('sdk.stream.stop') };
		},
		rest: {
			upload: (endpoint: string, params: unknown, events: UploadEvents) => {
				record('sdk.rest.upload', endpoint, params);
				upload.xhr = newXhr();
				upload.events = events;
				return upload.xhr;
			},
			post: (endpoint: string, params: unknown) => {
				record('sdk.rest.post', endpoint, params);
				return behavior.post(endpoint, params);
			},
			get: (endpoint: string, params: unknown) => {
				record('sdk.rest.get', endpoint, params);
				return behavior.get(endpoint, params);
			},
		},
	},
};

export const toastModule = {
	dispatchToastMessage: (payload: unknown) => record('toast', payload),
};

export const userModule = {
	getUserId: () => {
		record('getUserId');
		return behavior.userId;
	},
	getUser: () => {
		record('getUser');
		return behavior.user;
	},
};

export const settingsModule = {
	settings: {
		peek: (id: string) => {
			record('settings.peek', id);
			return behavior.settings[id];
		},
	},
};

export const threadMessageUtilsModule = {
	upsertThreadMessageInCache: (...args: unknown[]) => record('upsertThreadMessageInCache', ...args),
};

export const authorizationModule = {
	hasAtLeastOnePermission: (permission: string | string[], rid: string) => {
		record('hasAtLeastOnePermission', permission, rid);
		return [permission].flat().some((p) => behavior.permissions.includes(p));
	},
	hasPermission: (permission: string, rid?: string) => {
		record('hasPermission', permission, rid);
		return behavior.permissions.includes(permission);
	},
};

export const slashCommandModule = {
	slashCommands: {
		get commands() {
			return behavior.commands;
		},
	},
};

export const emojiModule = {
	emoji: {
		get list() {
			return behavior.emojis;
		},
	},
};

export const roomCoordinatorModule = {
	roomCoordinator: {
		readOnly: (room: unknown, user: unknown) => {
			record('roomCoordinator.readOnly', room, user);
			return behavior.readOnly;
		},
	},
};

const translate = (key: string, options?: Record<string, unknown>) =>
	options && Object.keys(options).length > 0 ? `${key} ${JSON.stringify(options)}` : key;

export const i18nModule = {
	t: translate,
	i18n: { t: translate },
};

let randomCount = 0;
export const resetRandom = (): void => {
	randomCount = 0;
};
export const randomModule = {
	Random: {
		id: () => {
			randomCount += 1;
			return `random-${randomCount}`;
		},
	},
};

export const imperativeModalModule = {
	GenericModal: 'GenericModal',
	imperativeModal: {
		open: (config: { component: unknown; props: Record<string, unknown> }) => {
			record('imperativeModal.open', config);
			modalProps.current = config.props;
		},
		close: () => record('imperativeModal.close'),
	},
	clientCallbacks: {},
};

export const modalProps: { current: Record<string, (() => unknown) | unknown> | undefined } = { current: undefined };

export const onClientBeforeSendMessageModule = {
	onClientBeforeSendMessage: (message: IMessage) => {
		record('onClientBeforeSendMessage', message);
		return behavior.beforeSendMessage(message);
	},
};

export const onClientMessageReceivedModule = {
	onClientMessageReceived: async (message: IMessage) => {
		record('onClientMessageReceived', message);
		return message;
	},
};

export const afterSendMessageCallbackModule = {
	afterSendMessageCallback: async (message: IMessage, rid: string) => {
		record('afterSendMessageCallback', message, rid);
	},
};

export const getPermaLinkModule = {
	getPermaLink: async (msgId: string) => {
		record('getPermaLink', msgId);
		if (behavior.permaLinkError) {
			throw behavior.permaLinkError;
		}
		return behavior.permaLinks[msgId] ?? `/permalink/${msgId}`;
	},
};

export const e2eModule = {
	e2e: {
		getInstanceByRoomId: async (rid: string) => {
			record('e2e.getInstanceByRoomId', rid);
			return behavior.e2eRoom;
		},
	},
};

export const userActionModule = {
	USER_ACTIVITIES: {
		USER_RECORDING: 'user-recording',
		USER_TYPING: 'user-typing',
		USER_UPLOADING: 'user-uploading',
		USER_PLAYING: 'user-playing',
	},
	UserAction: {
		stop: (...args: unknown[]) => record('UserAction.stop', ...args),
	},
};
