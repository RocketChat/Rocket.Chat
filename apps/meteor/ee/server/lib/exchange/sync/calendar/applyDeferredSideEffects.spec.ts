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

	it('refreshes every dirty user', async () => {
		await applyDeferredSideEffects(new Set(['a', 'b']));

		expect(refreshBusyPresence).toHaveBeenNthCalledWith(1, 'a');
		expect(refreshBusyPresence).toHaveBeenNthCalledWith(2, 'b');
	});

	it('reschedules the workspace jobs once, not once per user', async () => {
		await applyDeferredSideEffects(new Set(['a', 'b']));

		expect(setupNextNotification).toHaveBeenCalledTimes(1);
		expect(setupNextStatusChange).toHaveBeenCalledTimes(1);
	});

	it('does not reschedule when no user changed', async () => {
		await applyDeferredSideEffects(new Set());

		expect(setupNextNotification).not.toHaveBeenCalled();
		expect(setupNextStatusChange).not.toHaveBeenCalled();
	});

	it('keeps going for the other users when one presence write fails', async () => {
		refreshBusyPresence.mockRejectedValueOnce(new Error('boom'));

		await applyDeferredSideEffects(new Set(['a', 'b']));

		expect(refreshBusyPresence).toHaveBeenCalledTimes(2);
		expect(setupNextNotification).toHaveBeenCalled();
	});
});
