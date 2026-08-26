import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TimedVideoConfPopup from './TimedVideoConfPopup';
import { createFakeRoom } from '../../../../../../../tests/mocks/data';

const startCall = jest.fn();
const dismissOutgoing = jest.fn();
const setPreferences = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfStartCall: () => startCall,
	useVideoConfDismissOutgoing: () => dismissOutgoing,
	useVideoConfSetPreferences: () => setPreferences,
}));

const fakeRoom = createFakeRoom({ t: 'd' });

const renderPopup = () =>
	render(<TimedVideoConfPopup id={fakeRoom._id} rid={fakeRoom._id} position={0} />, {
		wrapper: mockAppRoot().withRoom(fakeRoom).build(),
	});

beforeEach(() => {
	startCall.mockClear();
	dismissOutgoing.mockClear();
});

it('starts the call for the room it was opened on', async () => {
	renderPopup();

	await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));

	expect(startCall).toHaveBeenCalledWith(fakeRoom._id);
});

// The call opens in its own window on that same click, so there is nothing left for this popup to say. A group
// call closed it by way of `calling/ended`; a direct one keeps ringing and never emits that, which left "Start a
// call" sitting behind the call it had just started.
it('closes itself once the call has been asked for', async () => {
	renderPopup();

	await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));

	expect(dismissOutgoing).toHaveBeenCalled();
});

// The call window asks how to arrive, on a preflight screen where the user can see themselves — so this popup
// doesn't, and a choice made here seconds earlier isn't quietly overruled there.
it('leaves the devices to the call window', async () => {
	render(<TimedVideoConfPopup id={fakeRoom._id} rid={fakeRoom._id} position={0} />, {
		wrapper: mockAppRoot().withRoom(fakeRoom).withSetting('VideoConf_Enable_Persistent_Chat', true).build(),
	});

	expect(await screen.findByRole('button', { name: 'Start_call' })).toBeInTheDocument();
	expect(screen.queryByTitle('Mic_on')).not.toBeInTheDocument();
	expect(screen.queryByTitle('Cam_on')).not.toBeInTheDocument();
});

it('asks about them when there is no call window to ask', async () => {
	render(<TimedVideoConfPopup id={fakeRoom._id} rid={fakeRoom._id} position={0} />, {
		wrapper: mockAppRoot().withRoom(fakeRoom).withSetting('VideoConf_Enable_Persistent_Chat', false).build(),
	});

	expect(await screen.findByTitle('Mic_on')).toBeInTheDocument();
	expect(screen.getByTitle('Cam_on')).toBeInTheDocument();
});
