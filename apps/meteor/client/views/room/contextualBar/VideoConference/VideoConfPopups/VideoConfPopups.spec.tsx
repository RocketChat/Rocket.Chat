import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import VideoConfPopups from './VideoConfPopups';
import { createFakeRoom } from '../../../../../../tests/mocks/data';
import { createFakeVideoConfCall, createFakeIncomingCall } from '../../../../../../tests/mocks/utils/video-conference';

const fakeRoom = createFakeRoom({ t: 'd' });
const fakeDirectVideoConfCall = createFakeVideoConfCall({ type: 'direct', rid: fakeRoom._id });
const fakeIncomingCall = createFakeIncomingCall({ rid: fakeRoom._id });

test('should render video conference incoming popup', async () => {
	render(<VideoConfPopups />, {
		wrapper: mockAppRoot()
			.withRoom(fakeRoom)
			.withEndpoint('GET', '/v1/video-conference.info', () => fakeDirectVideoConfCall as any)
			.withIncomingCalls([fakeIncomingCall])
			.build(),
	});

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
});

// Conference membership grants no room access, so a member added from outside the room gets rung for a room
// they can't see. The popup used to be built entirely around that room, and rendered nothing without it.
test('should render video conference incoming popup for a call in an inaccessible room', async () => {
	render(<VideoConfPopups />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/video-conference.info', () => fakeDirectVideoConfCall as any)
			.withIncomingCalls([fakeIncomingCall])
			.build(),
	});

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
	expect(await screen.findByText(fakeDirectVideoConfCall.createdBy.username)).toBeInTheDocument();
});

// An incoming call is listed with the others — docked in the sidebar, or behind the navbar button — instead of
// taking over the screen. The ring still sounds; it just no longer demands an answer before anything else can
// happen.
test('should not pop up an incoming call when the calls are listed instead', async () => {
	const { container } = render(<VideoConfPopups />, {
		wrapper: mockAppRoot()
			.withRoom(fakeRoom)
			.withSetting('VideoConf_Enable_Persistent_Chat', true)
			.withEndpoint('GET', '/v1/video-conference.info', () => fakeDirectVideoConfCall as any)
			.withIncomingCalls([fakeIncomingCall])
			.build(),
	});

	await waitFor(() => expect(container).toBeEmptyDOMElement());
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
