import { processTooLongMessage } from './processTooLongMessage';
import { createGoldenChat, resetStores } from '../goldenChat';
import { NOW, behavior, getCalls, modalProps, resetFakes } from '../goldenFakes';

jest.mock('../../toast', () => jest.requireActual('../goldenFakes').toastModule);
jest.mock('../../user', () => jest.requireActual('../goldenFakes').userModule);
jest.mock('../../settings', () => jest.requireActual('../goldenFakes').settingsModule);
jest.mock('../../../../lib/i18n', () => jest.requireActual('../goldenFakes').i18nModule);
jest.mock('@rocket.chat/ui-client', () => jest.requireActual('../goldenFakes').imperativeModalModule);
jest.mock('../../SDKClient', () => jest.requireActual('../goldenFakes').sdkModule);
jest.mock('../../authorization', () => jest.requireActual('../goldenFakes').authorizationModule);
jest.mock('../../utils/threadMessageUtils', () => jest.requireActual('../goldenFakes').threadMessageUtilsModule);
jest.mock('../../getPermaLink', () => jest.requireActual('../goldenFakes').getPermaLinkModule);

const longMessage = 'x'.repeat(11);

const settingsReads = [
	['settings.peek', 'Message_MaxAllowedSize'],
	['settings.peek', 'FileUpload_Enabled'],
	['settings.peek', 'Message_AllowConvertLongMessagesToAttachment'],
];

const modalOpen = [
	'imperativeModal.open',
	{
		component: 'GenericModal',
		props: {
			title: 'Message_too_long',
			children: 'Send_it_as_attachment_instead_question',
			onConfirm: '[Function onConfirm]',
			onClose: '[Function onClose]',
			onCancel: '[Function onClose]',
			variant: 'warning',
		},
	},
];

const flush = async () => {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve();
	}
};

const track = (promise: Promise<boolean>) => {
	const state = { settled: false, value: undefined as boolean | undefined };
	void promise.then((value) => {
		state.settled = true;
		state.value = value;
	});
	return state;
};

beforeEach(() => {
	jest.useFakeTimers({ now: NOW });
	resetFakes();
	resetStores();
	modalProps.current = undefined;
	behavior.settings.Message_MaxAllowedSize = 10;
});

afterEach(() => {
	jest.useRealTimers();
});

describe('processTooLongMessage golden: within the limit', () => {
	it.each([[''], ['short'], ['x'.repeat(10)]])('returns false after reading only the limit for %j', async (msg) => {
		const chat = createGoldenChat();

		await expect(processTooLongMessage(chat, { msg })).resolves.toBe(false);

		expect(getCalls()).toEqual([['settings.peek', 'Message_MaxAllowedSize']]);
	});
});

describe('processTooLongMessage golden: the limit counts UTF-16 units', () => {
	it('offers an attachment for six astral characters (twelve units)', async () => {
		const chat = createGoldenChat();

		const result = track(processTooLongMessage(chat, { msg: '\u{1F600}'.repeat(6) }));
		await flush();

		expect(getCalls().at(-1)).toEqual(modalOpen);
		expect(result.settled).toBe(false);
	});

	it('accepts ten BMP characters even though they take twenty bytes', async () => {
		const chat = createGoldenChat();

		await expect(processTooLongMessage(chat, { msg: '\u00e9'.repeat(10) })).resolves.toBe(false);
	});
});

describe('processTooLongMessage golden: no attachment offer', () => {
	it('toasts and restores the text while editing, without asking about an attachment', async () => {
		const chat = createGoldenChat({ editingMid: 'm1' });

		await expect(processTooLongMessage(chat, { msg: longMessage })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			...settingsReads,
			['chat.currentEditingMessage.getMID'],
			['toast', { type: 'error', message: new Error('Message_too_long') }],
			['chat.composer.setText', longMessage],
		]);
	});

	it('toasts when file uploads are disabled', async () => {
		behavior.settings.FileUpload_Enabled = false;
		const chat = createGoldenChat();

		await expect(processTooLongMessage(chat, { msg: longMessage })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			...settingsReads,
			['chat.currentEditingMessage.getMID'],
			['toast', { type: 'error', message: new Error('Message_too_long') }],
			['chat.composer.setText', longMessage],
		]);
	});

	it('toasts when converting long messages is disabled', async () => {
		behavior.settings.Message_AllowConvertLongMessagesToAttachment = false;
		const chat = createGoldenChat();

		await expect(processTooLongMessage(chat, { msg: longMessage })).resolves.toBe(true);

		expect(getCalls().at(-1)).toEqual(['chat.composer.setText', longMessage]);
	});

	it('toasts without a composer and has nowhere to restore the text', async () => {
		behavior.settings.FileUpload_Enabled = false;
		const chat = createGoldenChat({ withComposer: false });

		await expect(processTooLongMessage(chat, { msg: longMessage })).resolves.toBe(true);

		expect(getCalls()).toEqual([
			...settingsReads,
			['chat.currentEditingMessage.getMID'],
			['toast', { type: 'error', message: new Error('Message_too_long') }],
		]);
	});
});

describe('processTooLongMessage golden: attachment offer', () => {
	it('opens a warning modal and stays pending until the user answers', async () => {
		const chat = createGoldenChat();

		const result = track(processTooLongMessage(chat, { msg: longMessage }));
		await flush();

		expect(getCalls()).toEqual([...settingsReads, ['chat.currentEditingMessage.getMID'], modalOpen]);
		expect(result.settled).toBe(false);
	});

	it.each([['onClose'], ['onCancel']])('closes the modal and resolves true on %s, touching nothing else', async (answer) => {
		const chat = createGoldenChat();

		const result = track(processTooLongMessage(chat, { msg: longMessage }));
		await flush();
		(modalProps.current?.[answer] as () => void)();
		await flush();

		expect(getCalls().slice(5)).toEqual([['imperativeModal.close']]);
		expect(result).toEqual({ settled: true, value: true });
	});

	it('on confirm: builds the file, clears the composer, closes the modal, uploads the file, then resolves true', async () => {
		const chat = createGoldenChat();

		const result = track(processTooLongMessage(chat, { msg: longMessage }));
		await flush();
		await (modalProps.current?.onConfirm as () => Promise<void>)();
		await flush();

		expect(getCalls().slice(5)).toEqual([
			['getUser'],
			['chat.composer.clear'],
			['imperativeModal.close'],
			['chat.flows.uploadFiles', { files: [expect.any(File)] }],
		]);
		const [, { files }] = getCalls().at(-1) as [string, { files: File[] }];
		expect({ name: files[0].name, type: files[0].type, size: files[0].size, lastModified: files[0].lastModified }).toEqual({
			name: `john.doe - ${NOW.toString()}.txt`,
			type: 'text/plain',
			size: 11,
			lastModified: NOW.getTime(),
		});
		expect(result).toEqual({ settled: true, value: true });
	});

	it('sizes the file in UTF-8 bytes, not in units of the limit', async () => {
		const chat = createGoldenChat();

		const result = track(processTooLongMessage(chat, { msg: 'é'.repeat(11) }));
		await flush();
		await (modalProps.current?.onConfirm as () => Promise<void>)();
		await flush();

		const [, { files }] = getCalls().at(-1) as [string, { files: File[] }];
		expect(files[0].size).toBe(22);
		expect(result.settled).toBe(true);
	});

	it('names the file after "anonymous" when there is no user', async () => {
		behavior.user = undefined;
		const chat = createGoldenChat();

		void processTooLongMessage(chat, { msg: longMessage });
		await flush();
		await (modalProps.current?.onConfirm as () => Promise<void>)();

		const [, { files }] = getCalls().at(-1) as [string, { files: File[] }];
		expect(files[0].name).toBe(`anonymous - ${NOW.toString()}.txt`);
	});

	it('never resolves when the upload rejects: the confirm handler rejects and the flow stays pending', async () => {
		const failure = new Error('upload failed');
		const chat = createGoldenChat();
		Object.assign(chat.flows, {
			uploadFiles: async () => {
				throw failure;
			},
		});

		const result = track(processTooLongMessage(chat, { msg: longMessage }));
		await flush();
		await expect((modalProps.current?.onConfirm as () => Promise<void>)()).rejects.toBe(failure);
		await flush();

		expect(result.settled).toBe(false);
	});
});
