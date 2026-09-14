import { applyDeferredSideEffects } from './applyDeferredSideEffects';

const refreshBusyPresence = jest.fn();
const setupNextNotification = jest.fn();
const setupNextStatusChange = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	Calendar: {
		refreshBusyPresence: (...args: unknown[]) => refreshBusyPresence(...args),
		setupNextNotification: () => setupNextNotification(),
		setupNextStatusChange: () => setupNextStatusChange(),
	},
}));

describe('applyDeferredSideEffects', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		refreshBusyPresence.mockResolvedValue(undefined);
		setupNextNotification.mockResolvedValue(undefined);
		setupNextStatusChange.mockResolvedValue(undefined);
	});

	it('passes each user their own removal gate', async () => {
		await applyDeferredSideEffects(
			new Map([
				['a', true],
				['b', false],
			]),
		);

		expect(refreshBusyPresence).toHaveBeenNthCalledWith(1, 'a', { removedEvents: true });
		expect(refreshBusyPresence).toHaveBeenNthCalledWith(2, 'b', { removedEvents: false });
	});

	it('reschedules the workspace jobs once, not once per user', async () => {
		await applyDeferredSideEffects(
			new Map([
				['a', false],
				['b', false],
			]),
		);

		expect(setupNextNotification).toHaveBeenCalledTimes(1);
		expect(setupNextStatusChange).toHaveBeenCalledTimes(1);
	});

	it('does not reschedule when no user changed', async () => {
		await applyDeferredSideEffects(new Map());

		expect(setupNextNotification).not.toHaveBeenCalled();
	});

	it('keeps going for the other users when one presence write fails', async () => {
		refreshBusyPresence.mockRejectedValueOnce(new Error('boom'));

		await applyDeferredSideEffects(
			new Map([
				['a', false],
				['b', false],
			]),
		);

		expect(refreshBusyPresence).toHaveBeenCalledTimes(2);
		expect(setupNextNotification).toHaveBeenCalled();
	});
});
