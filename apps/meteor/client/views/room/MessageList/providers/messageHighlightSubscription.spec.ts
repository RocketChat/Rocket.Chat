import { clearHighlightMessage, getSnapshot, setHighlightMessage, subscribe } from './messageHighlightSubscription';

afterEach(() => {
	clearHighlightMessage();
});

it('notifies every subscriber of a highlight', () => {
	const first = jest.fn();
	const second = jest.fn();
	subscribe(first);
	subscribe(second);

	setHighlightMessage('message-id');

	expect(getSnapshot()).toBe('message-id');
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(1);
});

it('keeps notifying the other subscribers once one unsubscribes', () => {
	const first = jest.fn();
	const second = jest.fn();
	const unsubscribeFirst = subscribe(first);
	const unsubscribeSecond = subscribe(second);

	unsubscribeSecond();
	setHighlightMessage('message-id');

	expect(first).toHaveBeenCalledTimes(1);
	expect(second).not.toHaveBeenCalled();
	unsubscribeFirst();
});
