export type SmokeRow = { name: string; passed: boolean; error?: string };

const firstLine = (error: unknown): string => String((error as { message?: string })?.message ?? error).split('\n')[0];

const noop = () => {};
const asyncNoop = async () => {};
const fakeMessage = {
	_id: 'smoke-1',
	rid: 'room-1',
	msg: '/help test',
	ts: new Date(),
	u: { _id: 'u1', username: 'smokebot', name: 'Smoke' },
	_updatedAt: new Date(),
};

const runSlashSmoke = async (): Promise<void> => {
	const { processSlashCommandCore } = require('../../meteor/client/lib/chats/core/processSlashCommand') as typeof import('../../meteor/client/lib/chats/core/processSlashCommand');

	const deps = {
		getCommand: () => undefined,
		isUnrecognizedAllowed: () => false,
		hasAtLeastOnePermission: () => true,
		postTelemetry: asyncNoop,
		runCommand: async () => ({ result: undefined }),
		t: (_k: string, opts: { command: string }) => `no: ${opts.command}`,
		escapeHTML: (s: string) => s,
		randomId: () => 'eph-1',
	};

	const chat = {
		composer: { clear: noop },
		data: { pushEphemeralMessage: asyncNoop },
		uid: 'u1',
		ActionManager: { generateTriggerId: () => 'trig', notifyBusy: noop, notifyIdle: noop },
	};

	const handled = await processSlashCommandCore(deps as any, chat as any, fakeMessage as any);
	if (handled !== true) {
		throw new Error(`expected true (unrecognized /help), got ${handled}`);
	}
};

const runSendSmoke = async (): Promise<void> => {
	const { sendMessageCore } = require('../../meteor/client/lib/chats/core/sendMessage') as typeof import('../../meteor/client/lib/chats/core/sendMessage');

	const deps = {
		getUserId: () => 'u1',
		getUser: () => ({ username: 'smokebot', name: 'Smoke' }),
		trim: (s: string | undefined) => (s ?? '').trim(),
		getMessage: () => undefined,
		storeMessage: noop,
		updateMessage: noop,
		getRoom: () => ({ federated: false }),
		isReadReceiptEnabled: () => false,
		onClientMessageReceived: async (m: any) => m,
		onClientBeforeSendMessage: async (m: any) => m,
		upsertThreadMessage: noop,
		postMessage: asyncNoop,
		afterSendMessage: asyncNoop,
		notifyError: noop,
		notifyAlreadySent: noop,
		notifyMessageNotFound: noop,
		flows: {
			processSetReaction: async () => false,
			processTooLongMessage: async () => false,
			processSlashCommand: async () => false,
			processMessageUploads: async () => false,
			processMessageEditing: async () => false,
		},
	};

	const chat = {
		composer: {
			clear: noop,
			dismissAllQuotedMessages: noop,
			uploads: { get: () => [] },
			quotedMessages: { get: () => [] },
		},
		data: {
			isSubscribedToRoom: async () => true,
			joinRoom: asyncNoop,
			composeMessage: async () => ({ ...fakeMessage }),
			findMessageByID: async () => null,
		},
		readStateManager: { clearUnreadMark: noop },
		currentEditingMessage: { getMID: () => undefined, reset: asyncNoop, stop: noop },
		flows: { processMessageEditing: asyncNoop, requestMessageDeletion: asyncNoop },
	};

	const sent = await sendMessageCore(deps as any, chat as any, { text: 'hello' });
	if (sent !== true) {
		throw new Error(`expected true for a plain send, got ${sent}`);
	}
};

export const runFlowsSmoke = async (): Promise<SmokeRow[]> => {
	const cases: [string, () => Promise<void>][] = [
		['processSlashCommandCore', runSlashSmoke],
		['sendMessageCore', runSendSmoke],
	];

	const results: SmokeRow[] = [];
	for (const [name, fn] of cases) {
		try {
			await fn();
			results.push({ name, passed: true });
		} catch (error) {
			results.push({ name, passed: false, error: firstLine(error) });
		}
	}
	return results;
};
