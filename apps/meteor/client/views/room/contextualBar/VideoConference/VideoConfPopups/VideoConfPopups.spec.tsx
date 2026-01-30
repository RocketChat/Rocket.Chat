import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

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
