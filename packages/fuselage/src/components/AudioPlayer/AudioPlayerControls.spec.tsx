import { screen } from '@testing-library/react';

import AudioPlayerControls from './AudioPlayerControls';
import { render } from '../../testing';

const renderControls = (props: { currentTime: number; durationTime?: number; isPlaying?: boolean }) =>
	render(
		<AudioPlayerControls
			isPlaying={props.isPlaying ?? true}
			currentTime={props.currentTime}
			durationTime={props.durationTime ?? 0}
			playbackSpeed={1}
			onTogglePlay={jest.fn()}
			onSeek={jest.fn()}
			onChangePlaybackSpeed={jest.fn()}
		/>,
	);

describe('[AudioPlayerControls elapsed time]', () => {
	it.each([
		[0, '00:00'],
		[59, '00:59'],
		[61.9, '01:01'],
		[3599, '59:59'],
		[3600, '01:00:00'],
		[3661, '01:01:01'],
		[86400, '24:00:00'],
		[90061, '25:01:01'],
	])('shows %s seconds as %s', (currentTime, expected) => {
		renderControls({ currentTime });

		expect(screen.getByText(expected)).toBeInTheDocument();
	});

	it('shows the duration before playback starts', () => {
		renderControls({ currentTime: 0, durationTime: 3600, isPlaying: false });

		expect(screen.getByText('01:00:00')).toBeInTheDocument();
	});
});
