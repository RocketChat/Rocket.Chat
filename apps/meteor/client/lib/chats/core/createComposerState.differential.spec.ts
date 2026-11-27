import type { IMessage } from '@rocket.chat/core-typings';

import { createComposerState, type ComposerStateCore, type ComposerStateCoreParams } from './createComposerState';
import { createComposerStateCore } from '../../composerStateCore';
import { clearCalls, getCalls, record } from '../goldenFakes';

const mockHooks: { observers: (() => void)[]; katex: boolean } = { observers: [], katex: false };

jest.mock('../uploads', () => ({
	createUploadsAPI: (room: unknown) => {
		jest.requireActual('../goldenFakes').record('createUploadsAPI', room);
		return { id: 'uploads' };
	},
}));

jest.mock('../../settings', () => ({
	settings: {
		observe: (key: string, callback: () => void) => {
			jest.requireActual('../goldenFakes').record('settings.observe', key);
			mockHooks.observers.push(callback);
			return () => {
				jest.requireActual('../goldenFakes').record('settings.stop');
			};
		},
	},
}));

jest.mock('../../messageBoxFormatting', () => ({
	formattingButtons: [
		{ label: 'bold' },
		{ label: 'italic', condition: () => true },
		{
			label: 'katex',
			condition: () => {
				jest.requireActual('../goldenFakes').record('condition.katex', mockHooks.katex);
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
	mockHooks.katex = false;
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
