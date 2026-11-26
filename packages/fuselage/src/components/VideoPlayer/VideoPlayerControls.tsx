import type { ChangeEvent, FocusEvent, RefObject } from 'react';
import { useState } from 'react';

import { useOwnerDocument } from '../../contexts';
import { formatMediaTime } from '../../helpers/formatMediaTime';
import { Box } from '../Box';
import { Icon } from '../Icon';
import VideoPlayerButton from './VideoPlayerButton';
import VideoPlayerSeekTrack from './VideoPlayerSeekTrack';

type VideoPlayerControlsProps = {
	videoRef: RefObject<HTMLVideoElement | null>;
	playButtonRef: RefObject<HTMLButtonElement | null>;
	visible: boolean;
	playing: boolean;
	muted: boolean;
	fullScreen: boolean;
	currentTime: number;
	duration: number;
	buffered: number;
	progress: number;
	playbackSpeed: number;
	onTogglePlay: () => void;
	onCyclePlaybackSpeed: () => void;
	onToggleFullScreen: () => void;
	playLabel: string;
	pauseLabel?: string;
	muteLabel?: string;
	unmuteLabel?: string;
	videoPlaybackRangeLabel?: string;
	changePlaybackSpeedLabel?: string;
	pictureInPictureLabel?: string;
	fullScreenLabel?: string;
	exitFullScreenLabel?: string;
};

const VideoPlayerControls = ({
	videoRef,
	playButtonRef,
	visible,
	playing,
	muted,
	fullScreen,
	currentTime,
	duration,
	buffered,
	progress,
	playbackSpeed,
	onTogglePlay,
	onCyclePlaybackSpeed,
	onToggleFullScreen,
	playLabel,
	pauseLabel = 'Pause',
	muteLabel = 'Mute',
	unmuteLabel = 'Unmute',
	videoPlaybackRangeLabel = 'Video Playback Range',
	changePlaybackSpeedLabel = 'Change Playback Speed',
	pictureInPictureLabel = 'Picture in picture',
	fullScreenLabel = 'Full screen',
	exitFullScreenLabel = 'Exit full screen',
}: VideoPlayerControlsProps) => {
	const { document: ownerDocument } = useOwnerDocument();
	const [focusVisible, setFocusVisible] = useState(false);
	const seekMax = duration || 0;

	return (
		<Box
			position='absolute'
			insetInline={0}
			insetBlockEnd={0}
			display='flex'
			flexDirection='column'
			paddingInline='x4'
			paddingBlockEnd='x4'
			backgroundColor='overlay'
			animated
			opacity={visible ? 1 : 0}
			invisible={!visible}
		>
			<Box position='relative' height='x16' marginInline='x8' marginBlockStart='x4'>
				<Box position='absolute' insetInline={0} insetBlockStart={6} height='x4'>
					<VideoPlayerSeekTrack buffered={buffered} progress={progress} />
				</Box>
				{focusVisible && (
					<Box position='absolute' inset={0} borderRadius='medium' borderWidth='medium' borderColor='highlight' aria-hidden />
				)}
				<Box
					is='input'
					type='range'
					position='absolute'
					inset={0}
					width='full'
					height='full'
					margin={0}
					opacity={0}
					min={0}
					max={seekMax}
					step={1}
					value={Math.min(currentTime, seekMax)}
					aria-label={videoPlaybackRangeLabel}
					aria-valuetext={formatMediaTime(currentTime)}
					tabIndex={visible ? 0 : -1}
					onChange={(e: ChangeEvent<HTMLInputElement>) => {
						if (videoRef.current) videoRef.current.currentTime = Number(e.currentTarget.value);
					}}
					onFocus={(e: FocusEvent<HTMLElement>) => setFocusVisible(e.currentTarget.matches(':focus-visible'))}
					onBlur={() => setFocusVisible(false)}
				/>
			</Box>
			<Box display='flex' alignItems='center'>
				<VideoPlayerButton ref={playButtonRef} label={playing ? pauseLabel : playLabel} onClick={onTogglePlay}>
					<Icon name={playing ? 'pause-shape-filled' : 'play-shape-filled'} size='x20' />
				</VideoPlayerButton>
				<VideoPlayerButton
					label={muted ? unmuteLabel : muteLabel}
					onClick={() => {
						if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
					}}
				>
					<Icon name={muted ? 'volume-off' : 'volume'} size='x20' />
				</VideoPlayerButton>
				<Box is='span' flexGrow={1} paddingInline='x4' fontScale='c1' withTruncatedText>
					{formatMediaTime(currentTime)} / {formatMediaTime(duration)}
				</Box>
				<VideoPlayerButton
					label={changePlaybackSpeedLabel}
					onClick={onCyclePlaybackSpeed}
					width='x40'
					height='x24'
					marginInline='x4'
					borderWidth='default'
					borderColor='extra-light'
					fontScale='c2'
				>
					{playbackSpeed}x
				</VideoPlayerButton>
				{ownerDocument.pictureInPictureEnabled && (
					<VideoPlayerButton label={pictureInPictureLabel} onClick={() => void videoRef.current?.requestPictureInPicture()}>
						<Icon name='new-window' size='x20' />
					</VideoPlayerButton>
				)}
				{ownerDocument.fullscreenEnabled && (
					<VideoPlayerButton label={fullScreen ? exitFullScreenLabel : fullScreenLabel} onClick={onToggleFullScreen}>
						<Icon name={fullScreen ? 'arrow-collapse' : 'arrow-expand'} size='x20' />
					</VideoPlayerButton>
				)}
			</Box>
		</Box>
	);
};

export default VideoPlayerControls;
