import { clearEditingMessage, getSnapshot, setEditingMessage, subscribe } from './editingMessageSubscription';

afterEach(() => {
	clearEditingMessage();
});

it('notifies every subscriber of the message being edited (R46)', () => {
	const first = jest.fn();
	const second = jest.fn();
	subscribe(first);
	subscribe(second);

	setEditingMessage('message-id');

	expect(getSnapshot()).toBe('message-id');
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(1);
});

it('keeps notifying the other subscribers once one unsubscribes (R46)', () => {
	const first = jest.fn();
	const second = jest.fn();
	const unsubscribeFirst = subscribe(first);
	const unsubscribeSecond = subscribe(second);

	unsubscribeSecond();
	setEditingMessage('message-id');

	expect(first).toHaveBeenCalledTimes(1);
	expect(second).not.toHaveBeenCalled();
	unsubscribeFirst();
});
