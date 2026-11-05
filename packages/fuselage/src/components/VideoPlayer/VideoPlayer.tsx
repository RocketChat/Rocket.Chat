import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, FocusEvent, RefAttributes, SyntheticEvent, TrackHTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useOwnerDocument } from '../../contexts';
import { formatMediaTime } from '../../helpers/formatMediaTime';
import { Box } from '../Box';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Throbber } from '../Throbber';
import VideoPlayerButton from './VideoPlayerButton';
import VideoPlayerSeekTrack from './VideoPlayerSeekTrack';

const CONTROLS_HIDE_DELAY = 2000;

type MediaEvent = SyntheticEvent<HTMLVideoElement>;

export type VideoPlayerProps = RefAttributes<HTMLVideoElement> & {
	src: string;
	type?: string;
	maxPlaybackSpeed?: number;
	minPlaybackSpeed?: number;
	playbackSpeedStep?: number;
	playLabel?: string;
	pauseLabel?: string;
	muteLabel?: string;
	unmuteLabel?: string;
	loadingLabel?: string;
	videoPlaybackRangeLabel?: string;
	changePlaybackSpeedLabel?: string;
	pictureInPictureLabel?: string;
	fullScreenLabel?: string;
	exitFullScreenLabel?: string;
	errorLabel?: string;
	retryLabel?: string;
	trackProps?: TrackHTMLAttributes<HTMLTrackElement>;
};

/**
 * A Fuselage’s custom VideoPlayer, with the same seek, time and speed controls
 * as the AudioPlayer drawn over the video. Controls hide while the video plays
 * and the pointer rests.
 */
const VideoPlayer = ({
	ref,
	src,
	type,
	maxPlaybackSpeed = 2,
	minPlaybackSpeed = 0.5,
	playbackSpeedStep = 0.25,
	playLabel = 'Play',
	pauseLabel = 'Pause',
	muteLabel = 'Mute',
	unmuteLabel = 'Unmute',
	loadingLabel = 'Loading',
	videoPlaybackRangeLabel = 'Video Playback Range',
	changePlaybackSpeedLabel = 'Change Playback Speed',
	pictureInPictureLabel = 'Picture in picture',
	fullScreenLabel = 'Full screen',
	exitFullScreenLabel = 'Exit full screen',
	errorLabel = "This video can't be played here",
	retryLabel = 'Retry',
	trackProps,
}: VideoPlayerProps) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const refs = useMergedRefs(ref, videoRef);
	const { document: ownerDocument } = useOwnerDocument();

	const [playing, setPlaying] = useState(false);
	const [started, setStarted] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [buffered, setBuffered] = useState(0);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);
	const [muted, setMuted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [fullScreen, setFullScreen] = useState(false);
	const [pointerActive, setPointerActive] = useState(false);
	const [focusVisible, setFocusVisible] = useState(false);

	const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(hideTimer.current), []);

	useEffect(() => {
		const onChange = () => setFullScreen(ownerDocument.fullscreenElement === containerRef.current);
		ownerDocument.addEventListener('fullscreenchange', onChange);
		return () => ownerDocument.removeEventListener('fullscreenchange', onChange);
	}, [ownerDocument]);

	const wakeControls = () => {
		setPointerActive(true);
		clearTimeout(hideTimer.current);
		hideTimer.current = setTimeout(() => setPointerActive(false), CONTROLS_HIDE_DELAY);
	};

	const togglePlay = () => {
		const video = videoRef.current;
		if (!video) return;
		if (video.paused) {
			void video.play();
		} else {
			video.pause();
		}
	};

	const cyclePlaybackSpeed = () => {
		const video = videoRef.current;
		if (!video) return;
		video.playbackRate = video.playbackRate >= maxPlaybackSpeed ? minPlaybackSpeed : video.playbackRate + playbackSpeedStep;
	};

	const toggleFullScreen = () => {
		if (ownerDocument.fullscreenElement) {
			void ownerDocument.exitFullscreen();
		} else {
			void containerRef.current?.requestFullscreen();
		}
	};

	const retry = () => {
		setError(false);
		setLoading(true);
		videoRef.current?.load();
	};

	const controlsVisible = !playing || pointerActive;
	const progress = duration ? (currentTime / duration) * 100 : 0;

	return (
		<Box
			ref={containerRef}
			position='relative'
			display='flex'
			overflow='hidden'
			alignItems='center'
			justifyContent='center'
			width='full'
			minHeight={error ? 'x160' : undefined}
			borderRadius='medium'
			backgroundColor='overlay'
			color='pure-white'
			onPointerMove={wakeControls}
			onFocus={wakeControls}
		>
			<Box
				is='video'
				ref={refs}
				display='block'
				width='full'
				maxHeight={fullScreen ? '100vh' : 'x368'}
				objectFit='contain'
				preload='metadata'
				playsInline
				onClick={togglePlay}
				onPlay={() => {
					setPlaying(true);
					setStarted(true);
					wakeControls();
				}}
				onPause={() => setPlaying(false)}
				onEnded={() => setPlaying(false)}
				onWaiting={() => setLoading(true)}
				onCanPlay={() => setLoading(false)}
				onPlaying={() => setLoading(false)}
				onError={() => setError(true)}
				onTimeUpdate={(e: MediaEvent) => setCurrentTime(e.currentTarget.currentTime)}
				onLoadedMetadata={(e: MediaEvent) => {
					setError(false);
					setDuration(e.currentTarget.duration);
				}}
				onDurationChange={(e: MediaEvent) => setDuration(e.currentTarget.duration)}
				onProgress={(e: MediaEvent) => {
					const { buffered: ranges, duration: total } = e.currentTarget;
					setBuffered(ranges.length && total ? (ranges.end(ranges.length - 1) / total) * 100 : 0);
				}}
				onRateChange={(e: MediaEvent) => setPlaybackSpeed(e.currentTarget.playbackRate)}
				onVolumeChange={(e: MediaEvent) => setMuted(e.currentTarget.muted)}
			>
				{/* A failed <source> fires `error` on itself, not on the <video> element. */}
				<source src={src} type={type} onError={() => setError(true)} />
				<track kind='captions' {...trackProps} />
			</Box>

			{error && (
				<Box
					role='alert'
					position='absolute'
					inset={0}
					display='flex'
					flexDirection='column'
					alignItems='center'
					justifyContent='center'
					gap='x8'
					padding='x24'
					textAlign='center'
					fontScale='p2m'
					color='default'
					backgroundColor='tint'
				>
					<Icon name='circle-exclamation' size='x24' color='danger' />
					{errorLabel}
					<Button variant='secondary' size='small' onClick={retry}>
						{retryLabel}
					</Button>
				</Box>
			)}

			{loading && !error && (
				<Box
					position='absolute'
					display='flex'
					alignItems='center'
					justifyContent='center'
					size='x48'
					borderRadius='full'
					backgroundColor='overlay'
				>
					<Throbber size='x16' inheritColor aria-label={loadingLabel} />
				</Box>
			)}

			{!started && !loading && !error && (
				<>
					<Box position='absolute'>
						<VideoPlayerButton label={playLabel} onClick={togglePlay} size='x48' borderRadius='full' backgroundColor='overlay'>
							<Icon name='play-shape-filled' size='x24' />
						</VideoPlayerButton>
					</Box>
					{duration > 0 && (
						<Box
							is='span'
							position='absolute'
							insetInlineEnd={8}
							insetBlockEnd={8}
							paddingInline='x4'
							borderRadius='small'
							backgroundColor='overlay'
							fontScale='c2'
						>
							{formatMediaTime(duration)}
						</Box>
					)}
				</>
			)}

			{started && !error && !controlsVisible && (
				<Box position='absolute' insetInline={0} insetBlockEnd={0} height='x2' aria-hidden>
					<VideoPlayerSeekTrack buffered={0} progress={progress} />
				</Box>
			)}

			{started && !error && (
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
					opacity={controlsVisible ? 1 : 0}
					invisible={!controlsVisible}
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
							max={duration || 0}
							step={1}
							value={Math.min(currentTime, duration || 0)}
							aria-label={videoPlaybackRangeLabel}
							tabIndex={controlsVisible ? 0 : -1}
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								if (videoRef.current) videoRef.current.currentTime = Number(e.currentTarget.value);
							}}
							onFocus={(e: FocusEvent<HTMLElement>) => setFocusVisible(e.currentTarget.matches(':focus-visible'))}
							onBlur={() => setFocusVisible(false)}
						/>
					</Box>
					<Box display='flex' alignItems='center'>
						<VideoPlayerButton label={playing ? pauseLabel : playLabel} onClick={togglePlay}>
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
							onClick={cyclePlaybackSpeed}
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
							<VideoPlayerButton label={fullScreen ? exitFullScreenLabel : fullScreenLabel} onClick={toggleFullScreen}>
								<Icon name={fullScreen ? 'arrow-collapse' : 'arrow-expand'} size='x20' />
							</VideoPlayerButton>
						)}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default VideoPlayer;
