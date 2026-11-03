import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallMessagePreviews from './CallMessagePreviews';
import type { ConferenceIncomingMessage } from '../../context/definitions';
import { MESSAGE_PREVIEW_VISIBLE_MS } from '../../lib/constants';

const ada = { username: 'ada', name: 'Ada Lovelace' };

const message = (_id: string, preview = `Message ${_id}`): ConferenceIncomingMessage => ({ _id, ...ada, preview });

const renderPreviews = ({ chatVisible = false } = {}) => {
	let listener: ((message: ConferenceIncomingMessage) => void) | undefined;
	const unsubscribe = jest.fn();
	const subscribe = jest.fn((next: (message: ConferenceIncomingMessage) => void) => {
		listener = next;
		return unsubscribe;
	});
	const onOpen = jest.fn();

	const view = render(<CallMessagePreviews subscribe={subscribe} chatVisible={chatVisible} onOpen={onOpen} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	const send = (...messages: ConferenceIncomingMessage[]) => act(() => messages.forEach((incoming) => listener?.(incoming)));

	const rerender = (props: { chatVisible: boolean }) =>
		view.rerender(<CallMessagePreviews subscribe={subscribe} chatVisible={props.chatVisible} onOpen={onOpen} />);

	return { ...view, rerender, send, onOpen, unsubscribe };
};

const previews = () => within(screen.getByRole('log')).queryAllByRole('button', { name: /Message/ });

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('previews each incoming message with who sent it and what it says', () => {
	const { send } = renderPreviews();

	send(message('1', 'Can everyone see my screen?'));

	expect(screen.getByRole('log')).toHaveTextContent('ada');
	expect(screen.getByRole('log')).toHaveTextContent('Can everyone see my screen?');
});

// A burst would otherwise stack down over the call.
it('keeps only the three most recent previews', () => {
	const { send } = renderPreviews();

	send(message('1'), message('2'), message('3'), message('4'));

	expect(previews().map((preview) => preview.textContent)).toEqual(['adaMessage 2', 'adaMessage 3', 'adaMessage 4']);
});

it('previews nothing while the chat is open', () => {
	const { send } = renderPreviews({ chatVisible: true });

	send(message('1'));

	expect(previews()).toHaveLength(0);
});

it('clears the previews when the chat opens', () => {
	const { send, rerender } = renderPreviews();

	send(message('1'));
	rerender({ chatVisible: true });
	rerender({ chatVisible: false });

	expect(previews()).toHaveLength(0);
});

it('takes a preview down after a while', () => {
	const { send } = renderPreviews();

	send(message('1'));
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS));

	expect(previews()).toHaveLength(0);
});

it('keeps a preview up while the pointer is over it', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'));
	await user.hover(previews()[0]);
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS * 2));

	expect(previews()).toHaveLength(1);

	await user.unhover(previews()[0]);
	act(() => jest.advanceTimersByTime(MESSAGE_PREVIEW_VISIBLE_MS));

	expect(previews()).toHaveLength(0);
});

// Someone tabbing to it has to be able to reach it before it goes.
it('keeps a preview up while it has focus', async () => {
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

it('dismisses a preview on request', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send } = renderPreviews();

	send(message('1'), message('2'));
	await user.click(within(screen.getByRole('log')).getAllByRole('button', { name: 'Dismiss' })[0]);

	expect(previews().map((preview) => preview.textContent)).toEqual(['adaMessage 2']);
});

it('opens the message it previews', async () => {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
	const { send, onOpen } = renderPreviews();

	send(message('1'), message('2'));
	await user.click(previews()[1]);

	expect(onOpen).toHaveBeenCalledWith('2');
});

it('stops listening when it goes away', () => {
	const { unmount, unsubscribe } = renderPreviews();

	unmount();

	expect(unsubscribe).toHaveBeenCalled();
});
