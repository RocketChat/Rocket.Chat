import type { AudioPlayerControls } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import AudioAttachment from './AudioAttachment';

const mockPlay = jest.fn();
const mockSeek = jest.fn();

jest.mock('../../../../../providers/MediaPlayerProvider', () => ({
	useMediaPlayer: () => ({
		play: mockPlay,
		toggle: jest.fn(),
		seek: mockSeek,
		cyclePlaybackRate: jest.fn(),
		activeTrackId: null,
		playing: false,
		currentTime: 5,
		duration: 60,
		playbackRate: 1,
	}),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useMediaUrl: () => (url: string) => url,
}));

jest.mock('@rocket.chat/fuselage', () => ({
	...jest.requireActual('@rocket.chat/fuselage'),
	AudioPlayerControls: ({
		currentTime,
		onSeek,
		onTogglePlay,
	}: Pick<ComponentProps<typeof AudioPlayerControls>, 'currentTime' | 'onSeek' | 'onTogglePlay'>) => (
		<div>
			<span data-testid='position'>{currentTime}</span>
			<button onClick={() => onSeek(42)}>seek</button>
			<button onClick={onTogglePlay}>toggle</button>
		</div>
	),
}));

describe('AudioAttachment seeking while inactive', () => {
	it('keeps the position local, without touching the shared player, until play is pressed', async () => {
		render(
			<AudioAttachment audio_url='/file-upload/a.mp3' audio_type='audio/mpeg' audio_size={1} title='a.mp3' source={{ mid: 'mid-b' }} />,
			{
				wrapper: mockAppRoot().build(),
			},
		);

		await userEvent.click(screen.getByText('seek'));

		expect(screen.getByTestId('position')).toHaveTextContent('42');
		expect(mockPlay).not.toHaveBeenCalled();
		expect(mockSeek).not.toHaveBeenCalled();

		await userEvent.click(screen.getByText('toggle'));

		expect(mockPlay).toHaveBeenCalledWith(expect.objectContaining({ id: 'mid-b:/file-upload/a.mp3' }), 42);
	});
});

describe('AudioAttachment waveform', () => {
	const mockFetch = jest.fn();
	const mockOfflineAudioContext = jest.fn(() => ({
		decodeAudioData: async () => ({ getChannelData: () => new Float32Array(40) }),
	}));

	const originalFetch = global.fetch;
	const originalOfflineAudioContext = window.OfflineAudioContext;

	beforeEach(() => {
		mockFetch.mockResolvedValue({ ok: true, headers: { get: () => null }, body: null });
		global.fetch = mockFetch;
		window.OfflineAudioContext = mockOfflineAudioContext as unknown as typeof OfflineAudioContext;
	});

	afterEach(() => {
		jest.clearAllMocks();
		global.fetch = originalFetch;
		window.OfflineAudioContext = originalOfflineAudioContext;
	});

	// The metadata-only audio element is hidden and has no accessible role to query it by.
	const showClip = (url: string) => {
		render(<AudioAttachment audio_url={url} audio_type='audio/mpeg' audio_size={1024} title='clip.mp3' />, {
			wrapper: mockAppRoot().build(),
		});
		// oxlint-disable-next-line testing-library/no-node-access
		return document.querySelector('audio') as HTMLAudioElement;
	};

	const loadMetadata = (audio: HTMLAudioElement, duration: number) => {
		Object.defineProperty(audio, 'duration', { value: duration });
		fireEvent.loadedMetadata(audio);
	};

	it('decodes a short clip at a low sample rate once its length is known', async () => {
		const audio = showClip('/file-upload/short.mp3');
		expect(mockFetch).not.toHaveBeenCalled();

		loadMetadata(audio, 30);

		await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/file-upload/short.mp3', expect.anything()));
		await waitFor(() => expect(mockOfflineAudioContext).toHaveBeenCalledWith(1, 1, 8000));
	});

	// A small file can still be hours of low-bitrate audio, which would decode to hundreds of MiB.
	it('skips a clip too long to decode, however small the file', async () => {
		const audio = showClip('/file-upload/long.mp3');

		loadMetadata(audio, 3 * 60 * 60);
		await act(async () => undefined);

		expect(mockFetch).not.toHaveBeenCalled();
		expect(mockOfflineAudioContext).not.toHaveBeenCalled();
	});
});
