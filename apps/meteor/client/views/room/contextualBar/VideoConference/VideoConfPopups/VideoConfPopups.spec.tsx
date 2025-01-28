import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import VideoConfPopups from './VideoConfPopups';
import { createFakeVideoConfCall, createFakeRoom } from '../../../../../../tests/mocks/data';

const fakeRoom = createFakeRoom({ t: 'd' });
const fakeDirectVideoConfCall = createFakeVideoConfCall({ type: 'direct' });
const fakeIncomingCall = {
	uid: '123',
	rid: '123',
	callId: '123',
	dismissed: false,
};

test('should render video conference incoming popup', async () => {
	render(<VideoConfPopups />, {
		wrapper: mockAppRoot()
			.withRoom(fakeRoom)
			.withEndpoint('GET', '/v1/video-conference.info', () => fakeDirectVideoConfCall as any)
			.withIncomingCalls([fakeIncomingCall])
			.build(),
		legacyRoot: true,
	});

	expect(await screen.findByRole('dialog')).toBeInTheDocument();
});
