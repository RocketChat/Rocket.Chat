import type { MouseEvent } from 'react';

import { Box, Button, Icon, IconButton } from '../..';
import AudioWaveform from './AudioWaveform';
import { formatMediaTime } from '../../helpers/formatMediaTime';
import { Slider } from '../Slider';
import { Throbber } from '../Throbber';

export type AudioPlayerControlsProps = {
	isPlaying: boolean;
	currentTime: number;
	durationTime: number;
	playbackSpeed: number;
	onTogglePlay: () => void;
	onSeek: (time: number) => void;
	onChangePlaybackSpeed: () => void;
	/** Normalised peaks (0 to 1); when set, the seek control is drawn as a waveform. */
	waveform?: number[];
	/** The media is fetching data and can't play yet. */
	loading?: boolean;
	/** The media failed to load; replaces the controls with an error message. */
	error?: boolean;
	/** Shows a retry action next to the error message. */
	onRetry?: () => void;
	download?: boolean;
	downloadHref?: string;
	onDownload?: (event: MouseEvent<HTMLElement>) => void;
	playLabel?: string;
	pauseLabel?: string;
	loadingLabel?: string;
	errorLabel?: string;
	retryLabel?: string;
	audioPlaybackRangeLabel?: string;
	changePlaybackSpeedLabel?: string;
	downloadAudioFileLabel?: string;
};

/**
 * Presentational, fully controlled audio controls (play/pause, seek, elapsed
 * and total time, playback speed and optional download). It owns no `<audio>`
 * element and no playback state, so it can be driven by any source — a local
 * element or a shared/persistent one. `AudioPlayer` wraps this with its own
 * element for the common self-contained case.
 */
const AudioPlayerControls = ({
	isPlaying,
	currentTime,
	durationTime,
	playbackSpeed,
	onTogglePlay,
	onSeek,
	onChangePlaybackSpeed,
	waveform,
	loading = false,
	error = false,
	onRetry,
	download = false,
	downloadHref,
	onDownload,
	playLabel = 'Play',
	pauseLabel = 'Pause',
	loadingLabel = 'Loading',
	errorLabel = "Couldn't load audio",
	retryLabel = 'Retry',
	audioPlaybackRangeLabel = 'Audio Playback Range',
	changePlaybackSpeedLabel = 'Change Playback Speed',
	downloadAudioFileLabel = 'Download Audio File',
}: AudioPlayerControlsProps) => {
	if (error) {
		return (
			<Box className='rcx-audio-player__controls' role='alert'>
				<Icon name='circle-exclamation' size='x20' color='danger' />
				<Box className='rcx-audio-player__error'>{errorLabel}</Box>
				{onRetry && (
					<Button variant='secondary' size='small' onClick={onRetry}>
						{retryLabel}
					</Button>
				)}
			</Box>
		);
	}

	const playAction = isPlaying
		? { label: pauseLabel, icon: 'pause-shape-filled' as const }
		: { label: playLabel, icon: 'play-shape-filled' as const };

	return (
		<Box className='rcx-audio-player__controls'>
			<IconButton
				variant='primary'
				size='medium'
				disabled={loading}
				onClick={onTogglePlay}
				aria-label={loading ? loadingLabel : playAction.label}
				icon={loading ? <Throbber size='x16' inheritColor /> : playAction.icon}
			/>
			{waveform?.length ? (
				<AudioWaveform
					aria-label={audioPlaybackRangeLabel}
					peaks={waveform}
					value={currentTime}
					maxValue={durationTime}
					onChange={onSeek}
				/>
			) : (
				<Box className='rcx-audio-player__range'>
					<Slider
						aria-label={audioPlaybackRangeLabel}
						showOutput={false}
						value={currentTime}
						maxValue={durationTime}
						onChange={(value) => onSeek(Array.isArray(value) ? value[0] : value)}
					/>
				</Box>
			)}
			<Box className={loading ? 'rcx-audio-player__time rcx-audio-player__time--loading' : 'rcx-audio-player__time'}>
				{loading && !durationTime ? '-:-- / -:--' : `${formatMediaTime(currentTime)} / ${formatMediaTime(durationTime)}`}
			</Box>
			{/* Fixed slot so the slider keeps its width when the label grows from 1x to 1.25x. */}
			<Box className='rcx-audio-player__speed'>
				<Button variant='secondary' size='small' onClick={onChangePlaybackSpeed} aria-label={changePlaybackSpeedLabel}>
					{playbackSpeed}x
				</Button>
			</Box>
			{download && (
				<IconButton
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
};

export default AudioPlayerControls;
