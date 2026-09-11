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

const renderProvider = (conferenceWindowEnabled: boolean) =>
	render(
		<VideoConfProvider>
			<StartCallButton />
		</VideoConfProvider>,
		{ wrapper: mockAppRoot().withJohnDoe().withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled).build() },
	);

const startCall = jest.spyOn(VideoConfManager, 'startCall').mockResolvedValue(undefined);
const setConferenceWindowEnabled = jest.spyOn(VideoConfManager, 'setConferenceWindowEnabled');

beforeEach(() => {
	openCall.mockClear();
	startCall.mockClear();
	setConferenceWindowEnabled.mockClear();
});

afterAll(() => {
	startCall.mockRestore();
	setConferenceWindowEnabled.mockRestore();
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

// Without the call window there is no preflight to wait for, so the conference is started here as it always was,
// and nothing opens until the manager says where.
it('starts the conference itself when there is no call window to ask', async () => {
	renderProvider(false);

	await userEvent.click(screen.getByRole('button', { name: 'call' }));

	expect(startCall).toHaveBeenCalledWith('room-1', undefined);
	expect(openCall).not.toHaveBeenCalled();
});

// The manager is the non-React half of the same gate, and it is what decides whether to ring, whether to post the
// join and whether a decline is recorded — so what it is told has to follow the setting.
it('tells the manager which flow it is in', async () => {
	renderProvider(false);
	expect(setConferenceWindowEnabled).toHaveBeenLastCalledWith(false);

	renderProvider(true);
	expect(setConferenceWindowEnabled).toHaveBeenLastCalledWith(true);
});

// A provider's own call URL is opened as it always was, with no watch on the window: the join was posted before
// it opened, and the page there is not ours to poll.
it('opens the provider URL the manager hands it', async () => {
	renderProvider(false);

	VideoConfManager.emit('call/join', { callId: 'call-1', url: 'https://call.example', providerName: 'test' });

	expect(openCall).toHaveBeenCalledWith('https://call.example', 'test');
});
