import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { renderHook } from '@testing-library/react';

import { useMediaSessionControls } from './useMediaSessionControls';

jest.mock('@rocket.chat/ui-media', () => ({
	stopTracks: jest.fn(),
	useDevicePermissionPrompt2: () => jest.fn(),
}));

const transfer = jest.fn();
const startCall = jest.fn();
const startAttendedTransfer = jest.fn();

const instance = {
	startCall,
	startAttendedTransfer,
	getState: () => ({ confirmed: true, call: { transfer } }),
} as unknown as MediaSignalingSession;

const renderControls = () => renderHook(() => useMediaSessionControls(instance)).result.current;

describe('useMediaSessionControls', () => {
	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('starts a SIP call to the number without its formatting', async () => {
		await renderControls().startCall('+49 176 10848201', 'sip', false);

		expect(startCall).toHaveBeenCalledWith('sip', '+4917610848201');
	});

	it('starts a call to a user with the id as it is', async () => {
		await renderControls().startCall('user 1', 'user', false);

		expect(startCall).toHaveBeenCalledWith('user', 'user 1');
	});

	it('does not start a SIP call when there is nothing to call', async () => {
		await renderControls().startCall('n/a', 'sip', false);

		expect(startCall).not.toHaveBeenCalled();
	});

	it('transfers a call to the SIP number without its formatting', () => {
		renderControls().forwardCall('sip', '(040) 123-456');

		expect(transfer).toHaveBeenCalledWith({ type: 'sip', id: '040123456' });
	});

	it('does not transfer a call when there is nothing to call', () => {
		renderControls().forwardCall('sip', ' - ');

		expect(transfer).not.toHaveBeenCalled();
	});

	it('consults the SIP number without its formatting before a transfer', async () => {
		await renderControls().consultBeforeTransfer('sip', '+49 (0)40 123456');

		expect(startAttendedTransfer).toHaveBeenCalledWith('sip', '+4940123456');
	});

	it('does not consult before a transfer when there is nothing to call', async () => {
		await renderControls().consultBeforeTransfer('sip', '');

		expect(startAttendedTransfer).not.toHaveBeenCalled();
	});
});
