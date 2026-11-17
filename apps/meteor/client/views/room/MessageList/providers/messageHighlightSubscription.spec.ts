import { clearHighlightMessage, getSnapshot, setHighlightMessage, subscribe } from './messageHighlightSubscription';

const unsubscribes: (() => void)[] = [];

const subscribeForTest = (callback: () => void): (() => void) => {
	const unsubscribe = subscribe(callback);
	unsubscribes.push(unsubscribe);
	return unsubscribe;
};

afterEach(() => {
	unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
	clearHighlightMessage();
});

it('notifies every subscriber of a highlight', () => {
	const first = jest.fn();
	const second = jest.fn();
	subscribeForTest(first);
	subscribeForTest(second);

	setHighlightMessage('message-id');

	expect(getSnapshot()).toBe('message-id');
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(1);
});

it('keeps notifying the other subscribers once one unsubscribes', () => {
	const first = jest.fn();
	const second = jest.fn();
	subscribeForTest(first);
	const unsubscribeSecond = subscribeForTest(second);

	unsubscribeSecond();
	setHighlightMessage('message-id');

	expect(first).toHaveBeenCalledTimes(1);
	expect(second).not.toHaveBeenCalled();
});
