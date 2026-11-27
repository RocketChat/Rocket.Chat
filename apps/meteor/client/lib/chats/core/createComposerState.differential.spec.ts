import type { IMessage } from '@rocket.chat/core-typings';

import { createComposerState, type ComposerStateCore, type ComposerStateCoreParams } from './createComposerState';
import { createComposerStateCore } from '../../composerStateCore';
import { clearCalls, getCalls, record } from '../goldenFakes';
import { legacyCreateComposerStateCore } from '../legacyComposerStateReference';

type Failure = 'none' | 'uploads' | 'observe' | 'condition' | 'conditionLater';

const mockHooks: { observers: (() => void)[]; katex: boolean; failure: Failure; observeThis: boolean[] } = {
	observers: [],
	katex: false,
	failure: 'none',
	observeThis: [],
};

jest.mock('../uploads', () => ({
	createUploadsAPI: (room: unknown) => {
		jest.requireActual('../goldenFakes').record('createUploadsAPI', room);
		if (mockHooks.failure === 'uploads') {
			throw new Error('uploads failed');
		}
		return { id: 'uploads' };
	},
}));

jest.mock('../../settings', () => {
	const self = {
		observe(this: unknown, key: string, callback: () => void) {
			jest.requireActual('../goldenFakes').record('settings.observe', key);
			mockHooks.observeThis.push(this === self);
			if (mockHooks.failure === 'observe') {
				throw new Error('observe failed');
			}
			mockHooks.observers.push(callback);
			return () => {
				jest.requireActual('../goldenFakes').record('settings.stop');
			};
		},
	};
	return { settings: self };
});

jest.mock('../../messageBoxFormatting', () => ({
	formattingButtons: [
		{ label: 'bold' },
		{ label: 'italic', condition: () => true },
		{
			label: 'katex',
			condition: () => {
				jest.requireActual('../goldenFakes').record('condition.katex', mockHooks.katex);
				if (mockHooks.failure === 'condition' || (mockHooks.failure === 'conditionLater' && mockHooks.katex)) {
					throw new Error('condition failed');
				}
				return mockHooks.katex;
			},
		},
	],
}));

const { formattingButtons } = jest.requireMock('../../messageBoxFormatting') as { formattingButtons: unknown[] };

const message = (_id: string, extra: object = {}) => ({ _id, ...extra }) as IMessage;

const logged = (state: ComposerStateCore): ComposerStateCore => {
	for (const name of ['quotedMessages', 'editing', 'recording', 'recordingVideo', 'isMicrophoneDenied', 'formatters'] as const) {
		state[name].subscribe(() => record(`notify.${name}`));
	}
	return state;
};

const view = (state: ComposerStateCore) => ({
	quoted: state.quotedMessages.get(),
	editing: state.editing.get(),
	recording: state.recording.get(),
	recordingVideo: state.recordingVideo.get(),
	isMicrophoneDenied: state.isMicrophoneDenied.get(),
	formatters: state.formatters.get().map(({ label }) => label),
	uploads: state.uploads,
});

type Script = { name: string; params: ComposerStateCoreParams; run: (state: ComposerStateCore) => Promise<void> };

const room = { rid: 'GENERAL' };

const scripts: Script[] = [
	{ name: 'nothing', params: { room }, run: async () => undefined },
	{ name: 'thread room', params: { room: { rid: 'GENERAL', tmid: 'thread' } }, run: async () => undefined },
	{
		name: 'quotes: add, replace, dismiss one, dismiss all',
		params: { room },
		run: async (state) => {
			state.addQuotedMessage(message('a'));
			state.addQuotedMessage(message('b'));
			state.addQuotedMessage(message('a', { msg: 'again' }));
			await state.dismissQuotedMessage('b');
			await state.dismissQuotedMessage('missing');
			await state.dismissAllQuotedMessages();
		},
	},
	{
		name: 'quotes go through prepareQuotedMessage',
		params: {
			room,
			prepareQuotedMessage: (original) => {
				record('prepareQuotedMessage', original._id);
				return { ...original, msg: 'limited' };
			},
		},
		run: async (state) => {
			state.addQuotedMessage(message('a'));
			state.addQuotedMessage(message('b'));
		},
	},
	{
		name: 'every flag toggles and notifies',
		params: { room },
		run: async (state) => {
			state.setEditingMode(true);
			state.setEditingMode(true);
			state.setRecordingMode(true);
			state.setRecordingVideo(true);
			state.setIsMicrophoneDenied(true);
			state.setEditingMode(false);
			state.setRecordingMode(false);
		},
	},
	{
		name: 'formatters follow a setting change and read the condition live',
		params: { room },
		run: async () => {
			mockHooks.katex = true;
			mockHooks.observers.forEach((callback) => callback());
			mockHooks.katex = false;
			mockHooks.observers.forEach((callback) => callback());
		},
	},
	{
		name: 'stopping the subscription hands back the settings stop',
		params: { room },
		run: async (state) => {
			state.stopFormatterSubscription();
		},
	},
];

const runAdapter = async ({ params, run }: Script) => {
	const state = logged(createComposerStateCore(params));
	await run(state);
	return { log: getCalls(), view: view(state) };
};

const runCore = async ({ params, run }: Script) => {
	const { createUploadsAPI } = jest.requireMock('../uploads') as { createUploadsAPI: (room: unknown) => unknown };
	const { settings } = jest.requireMock('../../settings') as { settings: { observe: (key: string, cb: () => void) => () => void } };
	const state = logged(
		createComposerState(params, {
			createUploads: (target) => createUploadsAPI(target) as ComposerStateCore['uploads'],
			getFormattingButtons: () => formattingButtons as never,
			observeSettings: (callback) => settings.observe('*', callback),
		}),
	);
	await run(state);
	return { log: getCalls(), view: view(state) };
};

beforeEach(() => {
	clearCalls();
	mockHooks.observers = [];
	mockHooks.observeThis = [];
	mockHooks.katex = false;
	mockHooks.failure = 'none';
});

describe('composer state: adapter and core agree', () => {
	it.each(scripts.map((script) => [script.name, script] as const))('%s', async (_name, script) => {
		const fromAdapter = await runAdapter(script);
		clearCalls();
		mockHooks.observers = [];
		mockHooks.katex = false;
		const fromCore = await runCore(script);

		expect(fromCore.log).toEqual(fromAdapter.log);
		expect(fromCore.view).toEqual(fromAdapter.view);
	});

	it('creates the formatters before it observes settings, and the uploads last', async () => {
		const { log } = await runAdapter(scripts[0]);

		expect(log).toEqual([
			['condition.katex', false],
			['settings.observe', '*'],
			['createUploadsAPI', { rid: 'GENERAL' }],
		]);
	});

	it('passes the thread id to the uploads factory', async () => {
		const { log } = await runAdapter(scripts[1]);

		expect(log).toContainEqual(['createUploadsAPI', { rid: 'GENERAL', tmid: 'thread' }]);
	});

	it('reads the button list when it recomputes, not when the state is created', () => {
		const buttons: { label: string }[] = [{ label: 'one' }];
		let observed: () => void = () => undefined;
		const state = createComposerState(
			{ room },
			{
				createUploads: () => ({}) as ComposerStateCore['uploads'],
				getFormattingButtons: () => buttons as never,
				observeSettings: (callback) => {
					observed = callback;
					return () => undefined;
				},
			},
		);

		buttons.push({ label: 'two' });
		observed();

		expect(state.formatters.get().map(({ label }) => label)).toEqual(['one', 'two']);
	});
});

const coreFactory = (params: ComposerStateCoreParams): ComposerStateCore => {
	const { createUploadsAPI } = jest.requireMock('../uploads') as { createUploadsAPI: (room: unknown) => unknown };
	const { settings } = jest.requireMock('../../settings') as { settings: { observe: (key: string, cb: () => void) => () => void } };
	return createComposerState(params, {
		createUploads: (target) => createUploadsAPI(target) as ComposerStateCore['uploads'],
		getFormattingButtons: () => formattingButtons as never,
		observeSettings: (callback) => settings.observe('*', callback),
	});
};

const factories: [string, (params: ComposerStateCoreParams) => ComposerStateCore][] = [
	['adapter', createComposerStateCore],
	['core', coreFactory],
];

const execute = async (create: (params: ComposerStateCoreParams) => ComposerStateCore, { params, run }: Script, failure: Failure) => {
	clearCalls();
	mockHooks.observers = [];
	mockHooks.observeThis = [];
	mockHooks.katex = false;
	mockHooks.failure = failure;

	try {
		const state = logged(create(params));
		const keys = Object.keys(state);
		await run(state);
		return { log: getCalls(), observeThis: mockHooks.observeThis, keys, view: view(state) };
	} catch (error) {
		return { log: getCalls(), observeThis: mockHooks.observeThis, error: (error as Error).message };
	}
};

const failures: Failure[] = ['none', 'uploads', 'observe', 'condition', 'conditionLater'];

describe('composer state: the extracted code matches a frozen copy of the old logic', () => {
	describe.each(failures)('failure mode: %s', (failure) => {
		it.each(scripts.map((script) => [script.name, script] as const))('%s', async (_name, script) => {
			const legacy = await execute(legacyCreateComposerStateCore, script, failure);

			for (const [, create] of factories) {
				expect(await execute(create, script, failure)).toStrictEqual(legacy);
			}
		});
	});

	it('fails where the old code failed, and reads where it read', async () => {
		const outcomes = await Promise.all(failures.map((failure) => execute(legacyCreateComposerStateCore, scripts[0], failure)));

		expect(outcomes.map((outcome) => ('error' in outcome ? outcome.error : 'ok'))).toEqual([
			'ok',
			'uploads failed',
			'observe failed',
			'condition failed',
			'ok',
		]);
		expect(outcomes[1].log.map(([name]) => name)).toEqual(['condition.katex', 'settings.observe', 'createUploadsAPI']);
		expect(outcomes[2].log.map(([name]) => name)).toEqual(['condition.katex', 'settings.observe']);
		expect(outcomes[3].log.map(([name]) => name)).toEqual(['condition.katex']);
	});

	it.each(factories)('%s calls settings.observe as a method of settings', async (_name, create) => {
		const outcome = await execute(create, scripts[0], 'none');

		expect(outcome.observeThis).toEqual([true]);
	});

	it.each([['legacy', legacyCreateComposerStateCore] as const, ...factories])('%s builds independent instances', (_name, create) => {
		clearCalls();
		mockHooks.observers = [];
		const first = create({ room });
		const second = create({ room });

		first.setEditingMode(true);
		first.addQuotedMessage(message('a'));

		expect(second.editing.get()).toBe(false);
		expect(second.quotedMessages.get()).toEqual([]);
		expect(first).not.toBe(second);
		expect(first.uploads).toEqual(second.uploads);
	});

	it('keeps the key order of the old state object', async () => {
		const legacy = await execute(legacyCreateComposerStateCore, scripts[0], 'none');

		expect(legacy.keys).toEqual([
			'addQuotedMessage',
			'dismissQuotedMessage',
			'dismissAllQuotedMessages',
			'quotedMessages',
			'setEditingMode',
			'editing',
			'setRecordingMode',
			'recording',
			'setRecordingVideo',
			'recordingVideo',
			'setIsMicrophoneDenied',
			'isMicrophoneDenied',
			'formatters',
			'stopFormatterSubscription',
			'uploads',
		]);
	});
});
