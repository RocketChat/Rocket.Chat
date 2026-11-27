import { GenericModal, imperativeModal } from '@rocket.chat/ui-client';

import { processTooLongMessageCore, type TooLongChat, type TooLongDeps } from './processTooLongMessage';
import { t } from '../../../../lib/i18n';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import { getUser } from '../../user';
import { processTooLongMessage } from '../flows/processTooLongMessage';
import { createGoldenChat, resetStores } from '../goldenChat';
import { NOW, behavior, getCalls, modalProps, resetFakes, imperativeModalModule } from '../goldenFakes';
import { legacyProcessTooLongMessage } from '../legacyTooLongReference';

jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../../../lib/i18n', () => jest.requireActual('../goldenFakes').i18nModule);
jest.mock('@rocket.chat/ui-client', () => jest.requireActual('../goldenFakes').imperativeModalModule);
jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);

// The web modal, written out again here so the core is exercised with its own dependency object.
const offerAttachment = (msg: string, chat: TooLongChat): Promise<void> =>
	new Promise<void>((resolve) => {
		const onConfirm = async (): Promise<void> => {
			const contentType = 'text/plain';
			const messageBlob = new Blob([msg], { type: contentType });
			const fileName = `${getUser()?.username ?? 'anonymous'} - ${new Date().toString()}.txt`;
			const file = new File([messageBlob], fileName, { type: contentType, lastModified: Date.now() });

			chat.composer?.clear();
			imperativeModal.close();
			await chat.flows.uploadFiles({ files: [file] });

			resolve();
		};

		const onClose = (): void => {
			imperativeModal.close();
			resolve();
		};

		imperativeModal.open({
			component: GenericModal,
			props: {
				title: t('Message_too_long'),
				children: t('Send_it_as_attachment_instead_question'),
				onConfirm,
				onClose,
				onCancel: onClose,
				variant: 'warning',
			},
		});
	});

const coreDeps = (withOffer = true): TooLongDeps => ({
	getMaxAllowedSize: () => settings.peek('Message_MaxAllowedSize'),
	isFileUploadEnabled: () => settings.peek('FileUpload_Enabled'),
	isConvertToAttachmentAllowed: () => settings.peek('Message_AllowConvertLongMessagesToAttachment'),
	notifyTooLong: () => dispatchToastMessage({ type: 'error', message: new Error(t('Message_too_long')) }),
	...(withOffer && { offerAttachment }),
});

type Chat = ReturnType<typeof createGoldenChat>;
type Runner = (chat: Chat, message: { msg: string }) => Promise<boolean>;

const runners: Record<'legacy' | 'adapter' | 'core', Runner> = {
	legacy: legacyProcessTooLongMessage,
	adapter: processTooLongMessage,
	core: (chat, message) => processTooLongMessageCore(coreDeps(), chat, message),
};

type Step = 'onConfirm' | 'onClose' | 'onCancel';

type Case = {
	name: string;
	msg?: string;
	chat?: Parameters<typeof createGoldenChat>[0];
	setup?: () => void;
	script?: Step[];
	noFile?: boolean;
	noBlob?: boolean;
	noMessage?: boolean;
	uploadFails?: { error: unknown };
};

const rejectingUpload = (error: unknown): Pick<Case, 'uploadFails'> => ({ uploadFails: { error } });

const long = 'x'.repeat(11);

const cases: Case[] = [
	...['', 'short', 'x'.repeat(10)].map((msg): Case => ({ name: `within the limit: ${JSON.stringify(msg)}`, msg })),
	{ name: 'astral characters count as two units', msg: '\u{1F600}'.repeat(6), script: ['onClose'] },
	{ name: 'accented characters count as one unit', msg: 'é'.repeat(10) },
	{
		name: 'limit undefined: comparison with undefined is false, so every message is too long',
		msg: 'a',
		setup: () => {
			delete behavior.settings.Message_MaxAllowedSize;
		},
		script: ['onClose'],
	},
	{
		name: 'limit as a string is coerced',
		msg: '123456',
		setup: () => {
			behavior.settings.Message_MaxAllowedSize = '5';
		},
		script: ['onClose'],
	},
	{
		name: 'limit zero with an empty message',
		msg: '',
		setup: () => {
			behavior.settings.Message_MaxAllowedSize = 0;
		},
	},
	{ name: 'editing toasts and restores', chat: { editingMid: 'm1' } },
	{
		name: 'editing wins over a disabled upload',
		chat: { editingMid: 'm1' },
		setup: () => {
			behavior.settings.FileUpload_Enabled = false;
		},
	},
	{
		name: 'uploads disabled',
		setup: () => {
			behavior.settings.FileUpload_Enabled = false;
		},
	},
	{
		name: 'uploads setting undefined',
		setup: () => {
			delete behavior.settings.FileUpload_Enabled;
		},
	},
	{
		name: 'conversion disabled',
		setup: () => {
			behavior.settings.Message_AllowConvertLongMessagesToAttachment = false;
		},
	},
	{
		name: 'conversion setting undefined',
		setup: () => {
			delete behavior.settings.Message_AllowConvertLongMessagesToAttachment;
		},
	},
	{
		name: 'toast branch without composer',
		chat: { withComposer: false },
		setup: () => {
			behavior.settings.FileUpload_Enabled = false;
		},
	},
	{ name: 'modal left pending', script: [] },
	{ name: 'modal close', script: ['onClose'] },
	{ name: 'modal cancel', script: ['onCancel'] },
	{ name: 'modal close twice', script: ['onClose', 'onClose'] },
	{ name: 'modal confirm', script: ['onConfirm'] },
	{ name: 'modal confirm with multi-byte text and newlines', msg: 'é😀\nlínea '.repeat(3), script: ['onConfirm'] },
	{ name: 'modal confirm without a composer', chat: { withComposer: false }, script: ['onConfirm'] },
	{ name: 'modal confirm twice uploads twice', script: ['onConfirm', 'onConfirm'] },
	{ name: 'modal close then confirm', script: ['onClose', 'onConfirm'] },
	{
		name: 'confirm without a user names the file anonymous',
		script: ['onConfirm'],
		setup: () => {
			behavior.user = undefined;
		},
	},
	{
		name: 'confirm with a user without username',
		script: ['onConfirm'],
		setup: () => {
			behavior.user = { _id: 'u' };
		},
	},
	{
		name: 'confirm with an empty username keeps it empty',
		script: ['onConfirm'],
		setup: () => {
			behavior.user = { _id: 'u', username: '' };
		},
	},
	{
		name: 'confirm when uploadFiles rejects: the flow never settles',
		...rejectingUpload(new Error('upload failed')),
		script: ['onConfirm'],
	},
	{ name: 'confirm when uploadFiles rejects with a non-error', ...rejectingUpload('plain'), script: ['onConfirm'] },
	{ name: 'rejecting upload then close settles', ...rejectingUpload(new Error('upload failed')), script: ['onConfirm', 'onClose'] },
	{ name: 'confirm without File in the environment', script: ['onConfirm'], noFile: true },
	{ name: 'confirm without Blob in the environment', script: ['onConfirm'], noBlob: true },
	{
		name: 'opening the modal throws',
		script: [],
		setup: () => {
			jest.spyOn(imperativeModalModule.imperativeModal, 'open').mockImplementation(() => {
				throw new Error('open boom');
			});
		},
	},
	{
		name: 'confirm when closing the modal throws',
		script: ['onConfirm'],
		setup: () => {
			jest.spyOn(imperativeModalModule.imperativeModal, 'close').mockImplementation(() => {
				throw new Error('close boom');
			});
		},
	},
	{
		name: 'close when closing the modal throws: the flow never settles',
		script: ['onClose'],
		setup: () => {
			jest.spyOn(imperativeModalModule.imperativeModal, 'close').mockImplementation(() => {
				throw new Error('close boom');
			});
		},
	},
	...([Number.NaN, null, '', Number.POSITIVE_INFINITY, -1] as const).flatMap((limit): Case[] =>
		['', 'x'].map((msg) => ({
			name: `limit ${String(limit) || "''"} with ${JSON.stringify(msg)}`,
			msg,
			setup: () => {
				behavior.settings.Message_MaxAllowedSize = limit;
			},
			script: ['onClose'],
		})),
	),
	...([null, 0, '', '0'] as const).flatMap((value): Case[] => [
		{
			name: `file upload setting ${JSON.stringify(value)}`,
			setup: () => {
				behavior.settings.FileUpload_Enabled = value;
			},
			script: ['onClose'],
		},
		{
			name: `conversion setting ${JSON.stringify(value)}`,
			setup: () => {
				behavior.settings.Message_AllowConvertLongMessagesToAttachment = value;
			},
			script: ['onClose'],
		},
	]),
	{ name: 'message without msg', noMessage: true },
];

const flush = async () => {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve();
	}
};

const describeFile = async (file: File) => ({
	name: file.name,
	type: file.type,
	size: file.size,
	lastModified: file.lastModified,
	text: await new Promise<string>((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.readAsText(file);
	}),
});

const normalizeLog = async (log: ReturnType<typeof getCalls>) =>
	Promise.all(
		log.map(async (entry) => {
			const [name, ...args] = entry;
			if (name !== 'chat.flows.uploadFiles') {
				return entry;
			}
			const { files } = args[0] as { files: File[] };
			return [name, { files: await Promise.all(files.map(describeFile)) }];
		}),
	);

const describeError = (error: unknown) => (error instanceof Error ? `${error.name}: ${error.message}` : error);

const run = async (kind: keyof typeof runners, testCase: Case) => {
	jest.restoreAllMocks();
	resetFakes();
	resetStores();
	modalProps.current = undefined;
	behavior.settings.Message_MaxAllowedSize = 10;
	testCase.setup?.();

	const chat = createGoldenChat(testCase.chat);
	if (testCase.uploadFails) {
		const { error } = testCase.uploadFails;
		Object.assign(chat.flows, {
			uploadFiles: async () => {
				throw error;
			},
		});
	}

	const { File: realFile, Blob: realBlob } = globalThis;
	if (testCase.noFile) {
		Reflect.deleteProperty(globalThis, 'File');
	}
	if (testCase.noBlob) {
		Reflect.deleteProperty(globalThis, 'Blob');
	}

	try {
		const state: { settled: boolean; value?: unknown; error?: unknown } = { settled: false };
		let promise: Promise<boolean>;
		try {
			promise = runners[kind](chat, testCase.noMessage ? (undefined as unknown as { msg: string }) : { msg: testCase.msg ?? long });
		} catch (error) {
			promise = Promise.reject(error);
		}
		promise.then(
			(value) => {
				state.settled = true;
				state.value = value;
			},
			(error: unknown) => {
				state.settled = true;
				state.error = describeError(error);
			},
		);
		await flush();

		const trace: unknown[] = [{ step: 'start', ...state }];
		for (const step of testCase.script ?? []) {
			const handler = modalProps.current?.[step] as (() => unknown) | undefined;
			if (!handler) {
				trace.push({ step, handler: 'missing' });
				continue;
			}
			let handlerOutcome: unknown = 'ok';
			try {
				await handler();
			} catch (error) {
				handlerOutcome = describeError(error);
			}
			await flush();
			trace.push({ step, handlerOutcome, ...state });
		}

		return { trace, log: await normalizeLog(getCalls()) };
	} finally {
		globalThis.File = realFile;
		globalThis.Blob = realBlob;
	}
};

const ticksUntilSettled = async (promise: Promise<unknown>) => {
	let done = false;
	promise.then(
		() => {
			done = true;
		},
		() => {
			done = true;
		},
	);
	let ticks = 0;
	while (!done && ticks < 100) {
		await Promise.resolve();
		ticks++;
	}
	return ticks;
};

const ticks = async (kind: keyof typeof runners, testCase: Case, step?: Step) => {
	jest.restoreAllMocks();
	resetFakes();
	resetStores();
	modalProps.current = undefined;
	behavior.settings.Message_MaxAllowedSize = 10;
	testCase.setup?.();
	const chat = createGoldenChat(testCase.chat);
	const promise = runners[kind](chat, { msg: testCase.msg ?? long });
	if (!step) {
		return ticksUntilSettled(promise);
	}
	await flush();
	void (modalProps.current?.[step] as unknown as () => unknown)();
	return ticksUntilSettled(promise);
};

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
	jest.restoreAllMocks();
	jest.useRealTimers();
});

describe('processTooLongMessage differential: frozen legacy copy vs adapter vs core', () => {
	it.each(cases.map((c) => [c.name, c] as const))('%s', async (_name, testCase) => {
		const legacy = await run('legacy', testCase);
		const adapter = await run('adapter', testCase);
		const core = await run('core', testCase);

		expect(adapter).toEqual(legacy);
		expect(core).toEqual(legacy);
	});

	it('the table reaches every outcome: false, true, pending and rejected', async () => {
		const seen = new Set<string>();
		for (const testCase of cases) {
			const { trace } = await run('legacy', testCase);
			const last = trace.at(-1) as { settled?: boolean; value?: unknown; error?: unknown };
			if (!last.settled) {
				seen.add('pending');
			} else {
				seen.add(last.error !== undefined ? 'rejected' : String(last.value));
			}
		}
		expect([...seen].sort()).toEqual(['false', 'pending', 'rejected', 'true']);
	});

	it('pins the hang: a rejecting upload leaves the flow pending in the oracle', async () => {
		const hang = cases.find((c) => c.name.startsWith('confirm when uploadFiles rejects: the flow never')) as Case;
		const { trace } = await run('legacy', hang);

		expect(trace.at(-1)).toMatchObject({ step: 'onConfirm', handlerOutcome: 'Error: upload failed', settled: false });
	});

	it('pins what the oracle does when File or Blob is missing: the confirm handler rejects with a ReferenceError', async () => {
		const noFile = await run('legacy', { name: 'f', script: ['onConfirm'], noFile: true });
		const noBlob = await run('legacy', { name: 'b', script: ['onConfirm'], noBlob: true });

		expect(noFile.trace.at(-1)).toMatchObject({ handlerOutcome: 'ReferenceError: File is not defined', settled: false });
		expect(noFile.log.map(([name]) => name)).not.toContain('chat.composer.clear');
		expect(noBlob.trace.at(-1)).toMatchObject({ handlerOutcome: 'ReferenceError: Blob is not defined', settled: false });
	});

	it('records the file the oracle builds: name, type, size, time and content', async () => {
		const { log } = await run('legacy', { name: 'x', script: ['onConfirm'] });

		expect(log.at(-1)).toEqual([
			'chat.flows.uploadFiles',
			{ files: [{ name: `john.doe - ${NOW.toString()}.txt`, type: 'text/plain', size: 11, lastModified: NOW.getTime(), text: long }] },
		]);
	});

	it.each([
		['within the limit', { name: 'a', msg: 'ok' }, undefined],
		['toast branch', { name: 'b', chat: { editingMid: 'm1' } }, undefined],
		['modal closed', { name: 'c' }, 'onClose' as Step],
		['modal cancelled', { name: 'd' }, 'onCancel' as Step],
		['modal confirmed', { name: 'e' }, 'onConfirm' as Step],
	])('settles on the same microtask tick as the old async function: %s', async (_name, testCase, step) => {
		const legacy = await ticks('legacy', testCase, step);
		const adapter = await ticks('adapter', testCase, step);
		const core = await ticks('core', testCase, step);

		expect(legacy).toBeLessThan(100);
		expect(adapter).toBe(legacy);
		expect(core).toBe(legacy);
	});

	it('without an attachment offer the core toasts and restores the text, as the old code does with conversion disabled', async () => {
		const disabled: Case = {
			name: 'native',
			setup: () => {
				behavior.settings.Message_AllowConvertLongMessagesToAttachment = false;
			},
		};
		const legacy = await run('legacy', disabled);

		jest.restoreAllMocks();
		resetFakes();
		resetStores();
		behavior.settings.Message_MaxAllowedSize = 10;
		const chat = createGoldenChat();
		await expect(processTooLongMessageCore(coreDeps(false), chat, { msg: long })).resolves.toBe(true);

		const native = getCalls();
		expect(native).toEqual([
			['settings.peek', 'Message_MaxAllowedSize'],
			['settings.peek', 'FileUpload_Enabled'],
			['settings.peek', 'Message_AllowConvertLongMessagesToAttachment'],
			['chat.currentEditingMessage.getMID'],
			['toast', { type: 'error', message: new Error('Message_too_long') }],
			['chat.composer.setText', long],
		]);
		expect(legacy.log.map(([name]) => name)).toEqual(native.map(([name]) => name));
	});
});
