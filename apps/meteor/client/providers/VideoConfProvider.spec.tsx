import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useVideoConfStartCall } from '@rocket.chat/ui-video-conf';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VideoConfProvider from './VideoConfProvider';
import { VideoConfManager } from '../lib/VideoConfManager';

const openCall = jest.fn(() => null);

jest.mock('../views/room/contextualBar/VideoConference/hooks/useVideoConfOpenCall', () => ({
	useVideoConfOpenCall: () => openCall,
}));

// The mocked router builds no paths, and the path is what this is about: which window the click opens.
jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: () => ({
		buildRoutePath: ({ params, search }: { params: { id: string }; search: { rid: string } }) =>
			`/conference/${params.id}?rid=${search.rid}`,
	}),
}));

jest.mock('../views/room/contextualBar/VideoConference/VideoConfPopups', () => ({
	__esModule: true,
	default: () => null,
}));

const StartCallButton = () => {
	const startCall = useVideoConfStartCall();

	return (
		<button type='button' onClick={() => startCall('room-1')}>
			call
		</button>
	);
};

const renderProvider = (persistentChat: boolean) =>
	render(
		<VideoConfProvider>
			<StartCallButton />
		</VideoConfProvider>,
		{ wrapper: mockAppRoot().withJohnDoe().withSetting('VideoConf_Enable_Persistent_Chat', persistentChat).build() },
	);

const startCall = jest.spyOn(VideoConfManager, 'startCall').mockResolvedValue(undefined);

beforeEach(() => {
	openCall.mockClear();
	startCall.mockClear();
});

afterAll(() => {
	startCall.mockRestore();
});

// The reported bug: clicking *call* created the conference — a message in the room, a ring, a call in everyone's
// history — for a call the user hadn't agreed to yet. The click may only open the window.
it('creates no conference when the call window will ask first', async () => {
	renderProvider(true);

	await userEvent.click(screen.getByRole('button', { name: 'call' }));

	expect(startCall).not.toHaveBeenCalled();
	expect(openCall).toHaveBeenCalledWith(expect.stringContaining('/conference/new'));
	expect(openCall).toHaveBeenCalledWith(expect.stringContaining('rid=room-1'));
});

// Without persistent chat there is no preflight to wait for, so the conference is started here as it always was.
it('starts the conference itself when there is no call window to ask', async () => {
	renderProvider(false);

	await userEvent.click(screen.getByRole('button', { name: 'call' }));

	expect(startCall).toHaveBeenCalledWith('room-1', undefined);
});
