import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { RefAttributes, TrackHTMLAttributes } from 'react';
import { useState, useRef } from 'react';

import { Box } from '../..';
import AudioPlayerControls from './AudioPlayerControls';
import { useOwnerDocument } from '../../contexts';

function forceDownload(ownerDocument: Document, url: string, fileName?: string) {
	const xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	xhr.onload = function () {
		const urlCreator = window.URL || window.webkitURL;
		const imageUrl = urlCreator.createObjectURL(this.response);
		const tag = ownerDocument.createElement('a');
		tag.href = imageUrl;
		if (fileName) {
			tag.download = fileName;
		}
		ownerDocument.body.appendChild(tag);
		tag.click();
		ownerDocument.body.removeChild(tag);
	};
	xhr.send();
}

const getDurationForInfinityDurationAudioFile = (src: string, callback: (duration: number) => void) => {
	const audioElement = new Audio();
	audioElement.src = src;

	audioElement.addEventListener('loadedmetadata', () => {
		const { duration } = audioElement;
		if (duration === Infinity) {
			audioElement.currentTime = 1e101;
			return;
		}

		return callback(duration);
	});

	audioElement.addEventListener('durationchange', () => {
		if (audioElement.duration === Infinity) {
			return;
		}
		callback(audioElement.duration);
		audioElement.remove();
	});
};

/**
 * A Fuselage’s custom AudioPlayer.
 */
export type AudioPlayerProps = RefAttributes<HTMLAudioElement> & {
	src: string;
	type?: string;
	maxPlaybackSpeed?: number;
	minPlaybackSpeed?: number;
	playbackSpeedStep?: number;
	download?: boolean;
	playLabel?: string;
	pauseLabel?: string;
	audioPlaybackRangeLabel?: string;
	changePlaybackSpeedLabel?: string;
	downloadAudioFileLabel?: string;
	trackProps?: TrackHTMLAttributes<HTMLTrackElement>;
};

const AudioPlayer = ({
	ref,
	src,
	type = 'audio/mpeg',
	maxPlaybackSpeed = 2,
	minPlaybackSpeed = 0.5,
	playbackSpeedStep = 0.25,
	download = false,
	playLabel = 'Play',
	pauseLabel = 'Pause',
	audioPlaybackRangeLabel = 'Audio Playback Range',
	changePlaybackSpeedLabel = 'Change Playback Speed',
	downloadAudioFileLabel = 'Download Audio File',
	trackProps,
}: AudioPlayerProps) => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const refs = useMergedRefs(ref, audioRef);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [durationTime, setDurationTime] = useState(0);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);

	const handlePlay = () => {
		const isPlaying = audioRef.current?.paused;

		if (isPlaying) {
			void audioRef.current?.play();
		} else {
			audioRef.current?.pause();
		}
	};

	const handlePlaybackSpeed = (mod: 1 | -1) => {
		if (audioRef.current) {
			audioRef.current.playbackRate += playbackSpeedStep * mod;
		}
	};

	const handlePlaybackSpeedSingleControl = () => {
		if (!audioRef.current) return;

		const reachedMaxPlaybackSpeed = maxPlaybackSpeed === audioRef?.current?.playbackRate;

		if (reachedMaxPlaybackSpeed) {
			audioRef.current.playbackRate = minPlaybackSpeed;
			return;
		}
		handlePlaybackSpeed(1);
	};

	const { document: ownerDocument } = useOwnerDocument();

	return (
		<Box
			borderWidth='default'
			backgroundColor='tint'
			borderColor='extra-light'
			paddingBlock={12}
			paddingInlineEnd={8}
			paddingInlineStart={16}
			borderRadius='medium'
			width='100%'
			maxWidth='x300'
			display='flex'
			alignItems='center'
		>
			<AudioPlayerControls
				isPlaying={isPlaying}
				currentTime={currentTime}
				durationTime={durationTime}
				playbackSpeed={playbackSpeed}
				onTogglePlay={handlePlay}
				onSeek={(time) => {
					if (audioRef.current) {
						audioRef.current.currentTime = time;
					}
				}}
				onChangePlaybackSpeed={handlePlaybackSpeedSingleControl}
				download={download}
				downloadHref={src}
				onDownload={(e) => {
					const { host } = new URL(src);
					if (host !== ownerDocument.defaultView?.location.host) {
						e.preventDefault();
						forceDownload(ownerDocument, src);
					}
				}}
				playLabel={playLabel}
				pauseLabel={pauseLabel}
				audioPlaybackRangeLabel={audioPlaybackRangeLabel}
				changePlaybackSpeedLabel={changePlaybackSpeedLabel}
				downloadAudioFileLabel={downloadAudioFileLabel}
			/>
			<audio
				style={{ display: 'none' }}
				onTimeUpdate={(e) => {
					setCurrentTime((e.target as HTMLAudioElement).currentTime);
				}}
				onLoadedMetadata={(e) => {
					const { duration } = e.target as HTMLAudioElement;

					if (duration !== Infinity) {
						return setDurationTime(duration);
					}

					getDurationForInfinityDurationAudioFile(src, setDurationTime);
				}}
				onEnded={() => setIsPlaying(false)}
				ref={refs}
				preload='metadata'
				onRateChange={(e) => {
					setPlaybackSpeed((e.target as HTMLAudioElement).playbackRate);
				}}
				onPlay={() => {
					setIsPlaying(true);
				}}
				onPause={() => {
					setIsPlaying(false);
				}}
				controls
			>
				<source src={src} type={type} />
				<track kind='captions' {...trackProps} />
			</audio>
		</Box>
	);
};

export default AudioPlayer;
