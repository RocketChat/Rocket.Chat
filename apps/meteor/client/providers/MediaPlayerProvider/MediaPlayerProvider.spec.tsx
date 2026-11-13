import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMediaPlayer } from './MediaPlayerContext';
import MediaPlayerProvider from './MediaPlayerProvider';

const Player = () => {
	const { play } = useMediaPlayer();

	return (
		<button type='button' onClick={() => play({ id: 'm:/audio.mp3', url: 'https://example.com/audio.mp3?sig=old', title: 'audio.mp3' })}>
			play
		</button>
	);
};

describe('MediaPlayerProvider', () => {
	const originalFetch = global.fetch;
	const load = jest.fn();

	// The shared element is the one the provider loads when a track starts.
	const audioElement = () => load.mock.contexts[0] as HTMLAudioElement;

	beforeEach(() => {
		HTMLMediaElement.prototype.load = load;
		HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
		global.fetch = jest.fn(async () => ({
			ok: true,
			json: async () => ({ redirectUrl: 'https://example.com/audio.mp3?sig=new', expires: new Date(Date.now() + 60_000).toISOString() }),
		})) as never;
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it('recovers an expired URL on the shared element (message-attachments R25)', async () => {
		render(
			<MediaPlayerProvider>
				<Player />
			</MediaPlayerProvider>,
		);

		await userEvent.click(screen.getByRole('button', { name: 'play' }));

		expect(audioElement().src).toContain('sig=old');

		await act(async () => {
			audioElement().dispatchEvent(new Event('error'));
		});

		expect(global.fetch).toHaveBeenCalledWith(
			expect.objectContaining({ href: 'https://example.com/audio.mp3?sig=old&replyWithRedirectUrl=true' }),
			{ credentials: 'same-origin' },
		);
		expect(audioElement().src).toContain('sig=new');
	});
});
