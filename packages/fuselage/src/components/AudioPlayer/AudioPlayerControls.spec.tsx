import { composeStories } from '@storybook/react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './AudioPlayerControls.stories';
import { render } from '../../testing';

const { Idle, Playing, LongDuration, Loading, LoadError, Waveform } = composeStories(stories);

describe('[AudioPlayerControls Component]', () => {
	it('shows elapsed and total time while idle', () => {
		render(<Idle />);
		expect(screen.getByText('0:00 / 2:15')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
	});

	it('shows elapsed and total time while playing', () => {
		render(<Playing />);
		expect(screen.getByText('0:42 / 2:15')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
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
		fireEvent.change(range, { target: { value: '18' } });
		expect(onSeek).toHaveBeenCalledWith(18);
	});
});
