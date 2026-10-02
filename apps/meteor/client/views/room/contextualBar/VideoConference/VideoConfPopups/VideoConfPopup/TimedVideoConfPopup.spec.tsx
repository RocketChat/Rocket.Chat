import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TimedVideoConfPopup from './TimedVideoConfPopup';
import { createFakeRoom } from '../../../../../../../tests/mocks/data';
import { createFakeVideoConfCall, createFakeIncomingCall } from '../../../../../../../tests/mocks/utils/video-conference';

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

// A call whose room this user cannot see, which is what an added conference member gets rung for.
const call = createFakeIncomingCall({ rid: 'a-room-we-cannot-see' });
const conference = createFakeVideoConfCall({ type: 'direct', rid: call.rid });

const renderPopup = (conferenceWindowEnabled = false) =>
	render(<TimedVideoConfPopup id={fakeRoom._id} rid={fakeRoom._id} position={0} />, {
		wrapper: mockAppRoot().withRoom(fakeRoom).withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled).build(),
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
	renderPopup(true);

	await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));

	expect(dismissOutgoing).toHaveBeenCalled();
});

// Without a call window the wait is still here: this popup gives way to the outgoing one, which is what closing
// it would take away.
it('stays for the wait when there is no call window to hold it', async () => {
	renderPopup(false);

	await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));

	expect(dismissOutgoing).not.toHaveBeenCalled();
});

// The call window asks how to arrive, on a preflight screen where the user can see themselves — so this popup
// doesn't, and a choice made here seconds earlier isn't quietly overruled there.
it('leaves the devices to the call window', async () => {
	renderPopup(true);

	expect(await screen.findByRole('button', { name: 'Start_call' })).toBeInTheDocument();
	expect(screen.queryByTitle('Mic_on')).not.toBeInTheDocument();
	expect(screen.queryByTitle('Cam_on')).not.toBeInTheDocument();
});

it('asks about them when there is no call window to ask', async () => {
	renderPopup(false);

	expect(await screen.findByTitle('Mic_on')).toBeInTheDocument();
	expect(screen.getByTitle('Cam_on')).toBeInTheDocument();
});

// With the call window, an incoming call can reach someone who cannot see the room it belongs to — membership
// grants no room access — so whoever started it is the identity they do have. Without it, such a call was never
// announced at all and the popup rendered nothing, which is what the flag-off case below pins.
it('describes an incoming call in an inaccessible room by its caller', async () => {
	render(<TimedVideoConfPopup id={call.callId} rid={call.rid} isReceiving position={0} />, {
		wrapper: mockAppRoot()
			.withSetting('VideoConf_Conference_Window_Enabled', true)
			.withEndpoint('GET', '/v1/video-conference.info', () => conference as any)
			.build(),
	});

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
	expect(await screen.findByText(conference.createdBy.username)).toBeInTheDocument();
});

it('renders nothing for an incoming call in an inaccessible room without the call window', async () => {
	const { container } = render(<TimedVideoConfPopup id={call.callId} rid={call.rid} isReceiving position={0} />, {
		wrapper: mockAppRoot()
			.withSetting('VideoConf_Conference_Window_Enabled', false)
			.withEndpoint('GET', '/v1/video-conference.info', () => conference as any)
			.build(),
	});

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});
