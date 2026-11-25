import { composeStories } from '@storybook/react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './AudioPlayerControls.stories';
import { render } from '../../testing';

const { Idle, Playing, LongDuration, Loading, LoadError, WithDownload, Waveform } = composeStories(stories);

describe('[AudioPlayerControls Component]', () => {
	it('shows elapsed and total time while idle', () => {
		render(<Idle />);
		expect(screen.getByText('0:00 / 2:15')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
	});

	it('toggles playback and cycles the speed', async () => {
		const onTogglePlay = jest.fn();
		const onChangePlaybackSpeed = jest.fn();
		render(<Idle onTogglePlay={onTogglePlay} onChangePlaybackSpeed={onChangePlaybackSpeed} />);
		await userEvent.click(screen.getByRole('button', { name: 'Play' }));
		await userEvent.click(screen.getByRole('button', { name: 'Change Playback Speed' }));
		expect(onTogglePlay).toHaveBeenCalledTimes(1);
		expect(onChangePlaybackSpeed).toHaveBeenCalledTimes(1);
	});

	it('offers a download link only when asked to', () => {
		const { unmount } = render(<Idle />);
		expect(screen.queryByRole('link', { name: 'Download Audio File' })).not.toBeInTheDocument();
		unmount();
		render(<WithDownload downloadHref='/file.mp3' />);
		expect(screen.getByRole('link', { name: 'Download Audio File' })).toHaveAttribute('href', '/file.mp3');
	});

	it('shows elapsed and total time while playing', () => {
		render(<Playing />);
		expect(screen.getByText('0:42 / 2:15')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
	});

	it('shows a placeholder until the duration is known', () => {
		render(<Idle durationTime={0} />);
		expect(screen.getByText('-:-- / -:--')).toBeInTheDocument();
	});

	it('adds hours past one hour', () => {
		render(<LongDuration />);
		expect(screen.getByText('1:02:05 / 1:30:00')).toBeInTheDocument();
	});

	it('disables play while loading', () => {
		render(<Loading />);
		expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
		expect(screen.getByText('-:-- / -:--')).toBeInTheDocument();
	});

	it('keeps pause available while playback buffers', async () => {
		const onTogglePlay = jest.fn();
		render(<Loading isPlaying onTogglePlay={onTogglePlay} />);
		await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
		expect(onTogglePlay).toHaveBeenCalledTimes(1);
	});

	it('replaces the controls with an error and a retry action', async () => {
		const onRetry = jest.fn();
		render(<LoadError onRetry={onRetry} />);
		expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load audio");
		expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('seeks from the waveform', () => {
		const onSeek = jest.fn();
		render(<Waveform onSeek={onSeek} />);
		const range = screen.getByRole('slider', { name: 'Audio Playback Range' });
		expect(range).toHaveValue('9');
		expect(range).toHaveAttribute('aria-valuetext', '0:09');
		fireEvent.change(range, { target: { value: '18' } });
		expect(onSeek).toHaveBeenCalledWith(18);
	});
});
