import { Box, Button, IconButton, Margins, Slider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { formatPlaybackTime } from './formatPlaybackTime';

// TODO: this is a local copy of the controlled controls being upstreamed to
// fuselage (RocketChat/fuselage#2052). Once that ships in @rocket.chat/fuselage,
// delete this component (and formatPlaybackTime) and import AudioPlayerControls
// from '@rocket.chat/fuselage' instead.

type AudioPlayerControlsProps = {
	playing: boolean;
	currentTime: number;
	duration: number;
	playbackRate: number;
	onToggle: () => void;
	onSeek: (time: number) => void;
	onCyclePlaybackRate: () => void;
};

/**
 * Play/seek/time/speed controls, laid out like the original fuselage AudioPlayer.
 * Frameless so the same component can be reused both in-message and in the
 * sidebar card — the caller provides the surrounding container.
 */
const AudioPlayerControls = ({
	playing,
	currentTime,
	duration,
	playbackRate,
	onToggle,
	onSeek,
	onCyclePlaybackRate,
}: AudioPlayerControlsProps) => {
	const { t } = useTranslation();

	const maxValue = duration > 0 ? Math.floor(duration) : 0;
	const value = Math.min(Math.floor(currentTime), maxValue);
	const playLabel = playing ? t('Pause') : t('Play');

	return (
		<Box display='flex' alignItems='center' w='full'>
			<IconButton primary medium icon={playing ? 'pause-shape-filled' : 'play-shape-filled'} onClick={onToggle} aria-label={playLabel} />
			<Margins inline={8}>
				<Box fontScale='p2' color='secondary-info'>
					{playing || currentTime > 0 ? formatPlaybackTime(currentTime) : formatPlaybackTime(duration)}
				</Box>
				<Box mi={16} w='full'>
					<Slider
						aria-label={t('Seek')}
						showOutput={false}
						minValue={0}
						maxValue={maxValue || 1}
						step={1}
						value={value}
						onChange={(next) => onSeek(Array.isArray(next) ? next[0] : next)}
					/>
				</Box>
				<Button secondary small onClick={onCyclePlaybackRate} aria-label={t('Playback_speed')}>
					{`${playbackRate}x`}
				</Button>
			</Margins>
		</Box>
	);
};

export default AudioPlayerControls;
