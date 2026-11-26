import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import CallMessagePreviews from './CallMessagePreviews.js';
import { ConferenceContext } from '../../context/ConferenceContext.js';
import type { ConferenceNewMessage } from '../../context/definitions.js';
import { buildConferenceContext } from '../../fixtures/storyFixtures.js';
import { MESSAGE_PREVIEW_VISIBLE_MS } from '../../lib/constants.js';

const ada = { username: 'ada', name: 'Ada Lovelace' };

const message = (_id: string, text: string | undefined = `Message ${_id}`): ConferenceNewMessage => ({ _id, ...ada, text });

const renderPreviews = () => {
	let listener: ((message: ConferenceNewMessage) => void) | undefined;
	const off = jest.fn();
	const onNewMessage = jest.fn((next: (message: ConferenceNewMessage) => void) => {
		listener = next;
		return off;
	});
	const onOpen = jest.fn();
	const onFocusLeave = jest.fn();

	const view = render(
		<ConferenceContext.Provider value={buildConferenceContext({ room: { onNewMessage } })}>
			<CallMessagePreviews onOpen={onOpen} onFocusLeave={onFocusLeave} />
		</ConferenceContext.Provider>,
		{
			wrapper: mockAppRoot().withJohnDoe().withTranslations('en', 'core', { Chat_message_from_name: '{{name}}: {{message}}' }).build(),
		},
	);

	const send = (...messages: ConferenceNewMessage[]) => act(() => messages.forEach((newMessage) => listener?.(newMessage)));

	return { ...view, send, onOpen, onFocusLeave, off };
};

const previews = () => screen.queryAllByRole('button', { name: /^ada: / });

const dismissButtons = () => screen.getAllByRole('button', { name: 'Dismiss_message_from_name' });

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('previews each new message with who sent it and what it says', () => {
	const { send } = renderPreviews();

	send(message('1', 'Can everyone see my screen?'));

	expect(within(screen.getByRole('list', { name: 'New_messages' })).getByRole('button', { name: /^ada: / })).toHaveTextContent(
		'Can everyone see my screen?',
	);
});

// Announced from outside the list: a live region around the buttons reads them out with every message.
it('announces each new message without its buttons', () => {
	const { send } = renderPreviews();

	send(message('1', 'Can everyone see my screen?'));

	expect(screen.getByRole('log')).toHaveTextContent('ada: Can everyone see my screen?');
	expect(within(screen.getByRole('log')).queryByRole('button')).not.toBeInTheDocument();
});

it('says an encrypted message cannot be previewed', () => {
	const { send } = renderPreviews();

	send({ _id: '1', ...ada });

	expect(previews()[0]).toHaveTextContent('Encrypted_message_preview_unavailable');
});

// A burst would otherwise stack down over the call.
it('keeps only the most recent previews', () => {
	const { send } = renderPreviews();

	send(message('1'), message('2'), message('3'), message('4'));

	expect(previews().map((preview) => preview.textContent)).toEqual(['adaMessage 2', 'adaMessage 3', 'adaMessage 4']);
});

it('takes a preview down after a while', () => {
	const { send } = renderPreviews();

	send(message('1'));
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS));

	expect(previews()).toHaveLength(0);
});

// Hovering one holds them all: another leaving would move the one under the pointer away from it.
it('keeps every preview up while the pointer is over one', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'), message('2'));
	await user.hover(previews()[1]);
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS * 2));

	expect(previews()).toHaveLength(2);

	await user.unhover(previews()[1]);
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS));

	expect(previews()).toHaveLength(0);
});

// Someone tabbing to it has to be able to reach it before it goes.
it('keeps the previews up while one has focus', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'));
	await user.tab();
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS * 2));

	expect(previews()).toHaveLength(1);

	await user.tab();
	await user.tab();
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS));

	expect(previews()).toHaveLength(0);
});

// The one being read or about to be pressed must not be swapped for another under the pointer.
it('replaces nothing while the previews are held', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'), message('2'), message('3'));
	await user.hover(previews()[0]);
	send(message('4'));

	expect(previews().map((preview) => preview.textContent)).toEqual(['adaMessage 1', 'adaMessage 2', 'adaMessage 3']);

	await user.unhover(previews()[0]);

	expect(previews().map((preview) => preview.textContent)).toEqual(['adaMessage 2', 'adaMessage 3', 'adaMessage 4']);
});

it('dismisses a preview on request', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'), message('2'));
	await user.click(dismissButtons()[0]);

	expect(previews().map((preview) => preview.textContent)).toEqual(['adaMessage 2']);
});

it('moves focus to the next preview when one is dismissed from the keyboard', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send, onFocusLeave } = renderPreviews();

	send(message('1'), message('2'));
	act(() => dismissButtons()[0].focus());
	await user.keyboard('{Enter}');

	expect(previews()[0]).toHaveFocus();
	expect(onFocusLeave).not.toHaveBeenCalled();
});

it('hands focus back when the last preview is dismissed from the keyboard', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send, onFocusLeave } = renderPreviews();

	send(message('1'));
	act(() => dismissButtons()[0].focus());
	await user.keyboard('{Enter}');

	expect(onFocusLeave).toHaveBeenCalled();
});

it('opens the message it previews', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send, onOpen } = renderPreviews();

	send(message('1'), message('2'));
	await user.click(previews()[1]);

	expect(onOpen).toHaveBeenCalledWith('2');
});

it('stops listening when it goes away', () => {
	const { unmount, off } = renderPreviews();

	unmount();

	expect(off).toHaveBeenCalled();
});

// Held previews hold back the newer ones, which would otherwise never reach a screen reader.
it('announces a message that is not shown while the previews are held', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'), message('2'), message('3'));
	await user.hover(previews()[0]);
	send(message('4'));

	expect(previews().map((preview) => preview.textContent)).not.toContain('adaMessage 4');
	expect(screen.getByRole('log')).toHaveTextContent('ada: Message 4');
});

it('pauses the time a preview has left while the previews are held', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'));
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS - 1));
	await user.hover(previews()[0]);
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS * 2));
	await user.unhover(previews()[0]);
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS - 1));

	expect(previews()).toHaveLength(1);

	act(() => jest.advanceTimersByTime(1));

	expect(previews()).toHaveLength(0);
});
