import type { IMessage } from '@rocket.chat/core-typings';

import { createComposerStateCore } from './composerStateCore';

jest.mock('./chats/uploads', () => ({
	createUploadsAPI: () => ({}),
}));

const message = (_id: string) => ({ _id }) as IMessage;

const setup = (prepareQuotedMessage?: (message: IMessage) => IMessage) => {
	const state = createComposerStateCore({ room: { rid: 'GENERAL' }, prepareQuotedMessage });
	return { state, stop: state.stopFormatterSubscription };
};

describe('composer state core', () => {
	it('should keep one quote per message and notify on each change', () => {
		const { state, stop } = setup();
		const onChange = jest.fn();
		state.quotedMessages.subscribe(onChange);

		state.addQuotedMessage(message('a'));
		state.addQuotedMessage(message('b'));
		state.addQuotedMessage(message('a'));

		expect(state.quotedMessages.get().map(({ _id }) => _id)).toEqual(['b', 'a']);
		expect(onChange).toHaveBeenCalledTimes(3);
		stop();
	});

	it('should store the message the quote hook prepared', () => {
		const { state, stop } = setup((original) => ({ ...original, msg: 'limited' }));

		state.addQuotedMessage(message('a'));

		expect(state.quotedMessages.get()).toEqual([{ _id: 'a', msg: 'limited' }]);
		stop();
	});

	it('should dismiss one quote or all of them', async () => {
		const { state, stop } = setup();
		state.addQuotedMessage(message('a'));
		state.addQuotedMessage(message('b'));

		await state.dismissQuotedMessage('a');
		expect(state.quotedMessages.get().map(({ _id }) => _id)).toEqual(['b']);

		await state.dismissAllQuotedMessages();
		expect(state.quotedMessages.get()).toEqual([]);
		stop();
	});

	it('should notify subscribers when the editing mode changes', () => {
		const { state, stop } = setup();
		const onChange = jest.fn();
		state.editing.subscribe(onChange);

		state.setEditingMode(true);

		expect(state.editing.get()).toBe(true);
		expect(onChange).toHaveBeenCalledTimes(1);
		stop();
	});

	it('should start with the recording flags off and let them change', () => {
		const { state, stop } = setup();
		expect([state.recording.get(), state.recordingVideo.get(), state.isMicrophoneDenied.get()]).toEqual([false, false, false]);

		state.setRecordingMode(true);
		state.setRecordingVideo(true);
		state.setIsMicrophoneDenied(true);

		expect([state.recording.get(), state.recordingVideo.get(), state.isMicrophoneDenied.get()]).toEqual([true, true, true]);
		stop();
	});

	it('should not carry a DOM member', () => {
		const { state, stop } = setup();

		expect(Object.keys(state)).not.toContain('composerRef');
		stop();
	});
});
