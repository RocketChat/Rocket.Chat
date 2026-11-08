import type { MouseEvent } from 'react';

import { Box, Button, IconButton } from '../..';
import { Slider } from '../Slider';

const getMaskTime = (durationTime: number) => new Date(durationTime * 1000).toISOString().slice(durationTime > 60 * 60 ? 11 : 14, 19);

export type AudioPlayerControlsProps = {
	isPlaying: boolean;
	currentTime: number;
	durationTime: number;
	playbackSpeed: number;
	onTogglePlay: () => void;
	onSeek: (time: number) => void;
	onChangePlaybackSpeed: () => void;
	download?: boolean;
	downloadHref?: string;
	onDownload?: (event: MouseEvent<HTMLElement>) => void;
	playLabel?: string;
	pauseLabel?: string;
	audioPlaybackRangeLabel?: string;
	changePlaybackSpeedLabel?: string;
	downloadAudioFileLabel?: string;
};

/**
 * Presentational, fully controlled audio controls (play/pause, seek, elapsed
 * time, playback speed and optional download). It owns no `<audio>` element and
 * no playback state, so it can be driven by any source — a local element or a
 * shared/persistent one. `AudioPlayer` wraps this with its own element for the
 * common self-contained case.
 */
const AudioPlayerControls = ({
	isPlaying,
	currentTime,
	durationTime,
	playbackSpeed,
	onTogglePlay,
	onSeek,
	onChangePlaybackSpeed,
	download = false,
	downloadHref,
	onDownload,
	playLabel = 'Play',
	pauseLabel = 'Pause',
	audioPlaybackRangeLabel = 'Audio Playback Range',
	changePlaybackSpeedLabel = 'Change Playback Speed',
	downloadAudioFileLabel = 'Download Audio File',
}: AudioPlayerControlsProps) => (
	<Box className='rcx-audio-player__controls'>
		<IconButton
			variant='primary'
			size='medium'
			onClick={onTogglePlay}
			aria-label={isPlaying ? pauseLabel : playLabel}
			icon={isPlaying ? 'pause-shape-filled' : 'play-shape-filled'}
		/>
		<Box className='rcx-audio-player__track'>
			<Box className='rcx-audio-player__time'>{isPlaying || currentTime > 0 ? getMaskTime(currentTime) : getMaskTime(durationTime)}</Box>
			<Box className='rcx-audio-player__range'>
				<Slider
					aria-label={audioPlaybackRangeLabel}
					showOutput={false}
					value={currentTime}
					maxValue={durationTime}
					onChange={(value) => onSeek(Array.isArray(value) ? value[0] : value)}
				/>
			</Box>

			<Button variant='secondary' size='small' onClick={onChangePlaybackSpeed} aria-label={changePlaybackSpeedLabel}>
				{playbackSpeed}x
			</Button>
		</Box>
		{download && (
			<IconButton
				variant='primary'
				size='medium'
				is='a'
				href={downloadHref}
				download
				icon='download'
				aria-label={downloadAudioFileLabel}
				onClick={onDownload}
			/>
		)}
	</Box>
);

export default AudioPlayerControls;
