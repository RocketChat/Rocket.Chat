import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import AudioPlayer from './AudioPlayer';
import AudioPlayerControls, { getMaskTime } from './AudioPlayerControls';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

withResizeObserverMock();

describe('AudioPlayerControls', () => {
	describe('getMaskTime', () => {
		it('formats zero seconds as 00:00', () => {
			expect(getMaskTime(0)).toBe('00:00');
		});

		it('formats seconds below one minute', () => {
			expect(getMaskTime(5)).toBe('00:05');
			expect(getMaskTime(59)).toBe('00:59');
		});

		it('formats minutes and seconds below one hour', () => {
			expect(getMaskTime(60)).toBe('01:00');
			expect(getMaskTime(125)).toBe('02:05');
			expect(getMaskTime(3599)).toBe('59:59');
		});

		it('formats exactly one hour (3600s) as 01:00:00 without showing 00:00', () => {
			expect(getMaskTime(3600)).toBe('01:00:00');
		});

		it('formats durations greater than one hour with hours, minutes, and seconds', () => {
			expect(getMaskTime(3601)).toBe('01:00:01');
			expect(getMaskTime(3665)).toBe('01:01:05');
			expect(getMaskTime(7200)).toBe('02:00:00');
		});

		it('formats 24 hours (86400s) without wrapping to 00:00:00', () => {
			expect(getMaskTime(86400)).toBe('24:00:00');
		});

		it('formats durations past 24 hours accurately', () => {
			expect(getMaskTime(90061)).toBe('25:01:01');
			expect(getMaskTime(360000)).toBe('100:00:00');
		});

		it('floors fractional seconds to maintain integer time display', () => {
			expect(getMaskTime(3599.9)).toBe('59:59');
			expect(getMaskTime(3600.4)).toBe('01:00:00');
		});

		it('gracefully handles non-finite and negative durations without crashing', () => {
			expect(getMaskTime(NaN)).toBe('00:00');
			expect(getMaskTime(Infinity)).toBe('00:00');
			expect(getMaskTime(-Infinity)).toBe('00:00');
			expect(getMaskTime(-10)).toBe('00:00');
		});
	});

	describe('Component rendering & Speed control', () => {
		const defaultProps = {
			isPlaying: false,
			currentTime: 0,
			durationTime: 0,
			playbackSpeed: 1,
			onTogglePlay: jest.fn(),
			onSeek: jest.fn(),
			onChangePlaybackSpeed: jest.fn(),
		};

		it('renders without crashing', () => {
			render(<AudioPlayerControls {...defaultProps} />);
			expect(screen.getByText('00:00')).toBeInTheDocument();
		});

		it('displays duration time when not playing and currentTime is 0', () => {
			render(<AudioPlayerControls {...defaultProps} durationTime={3600} />);
			expect(screen.getByText('01:00:00')).toBeInTheDocument();
		});

		it('displays current elapsed time when currentTime is greater than 0', () => {
			render(<AudioPlayerControls {...defaultProps} currentTime={75} durationTime={3600} />);
			expect(screen.getByText('01:15')).toBeInTheDocument();
		});

		it('displays current elapsed time when playing', () => {
			render(<AudioPlayerControls {...defaultProps} isPlaying currentTime={3600} durationTime={7200} />);
			expect(screen.getByText('01:00:00')).toBeInTheDocument();
		});

		it('displays durations of 24 hours or more without wrapping', () => {
			render(<AudioPlayerControls {...defaultProps} durationTime={86400} />);
			expect(screen.getByText('24:00:00')).toBeInTheDocument();
		});

		it('renders the current playback speed on the speed button', () => {
			render(<AudioPlayerControls {...defaultProps} playbackSpeed={1.5} />);
			expect(screen.getByRole('button', { name: /change playback speed/i })).toHaveTextContent('1.5x');
		});

		it('triggers onChangePlaybackSpeed when the speed button is clicked', async () => {
			const onChangePlaybackSpeed = jest.fn();
			render(<AudioPlayerControls {...defaultProps} onChangePlaybackSpeed={onChangePlaybackSpeed} />);

			const speedButton = screen.getByRole('button', { name: /change playback speed/i });
			await userEvent.click(speedButton);

			expect(onChangePlaybackSpeed).toHaveBeenCalledTimes(1);
		});
	});

	describe('AudioPlayer speed cycle integration', () => {
		it('renders AudioPlayer with initial 1x speed and changes rate on click', async () => {
			const audioRef = createRef<HTMLAudioElement>();
			render(<AudioPlayer ref={audioRef} src='https://example.com/audio.mp3' />);

			const speedButton = screen.getByRole('button', { name: /change playback speed/i });
			expect(speedButton).toHaveTextContent('1x');
			expect(audioRef.current?.playbackRate).toBe(1);

			await userEvent.click(speedButton);
			expect(audioRef.current?.playbackRate).toBe(1.25);
		});
	});
});
