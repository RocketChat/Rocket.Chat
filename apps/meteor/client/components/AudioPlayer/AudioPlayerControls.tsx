import { Box, Button, IconButton, Margins, Slider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { formatPlaybackTime } from './formatPlaybackTime';

type AudioPlayerControlsProps = {
	playing: boolean;
	currentTime: number;
	duration: number;
	playbackRate: number;
	onToggle: () => void;
	onSeek: (time: number) => void;
	onCyclePlaybackRate: () => void;
	/** Compact spacing/sizing for tight docks such as the sidebar card. */
	compact?: boolean;
};

const AudioPlayerControls = ({
	playing,
	currentTime,
	duration,
	playbackRate,
	onToggle,
	onSeek,
	onCyclePlaybackRate,
	compact = false,
}: AudioPlayerControlsProps) => {
	const { t } = useTranslation();

	const maxValue = duration > 0 ? Math.floor(duration) : 0;
	const value = Math.min(Math.floor(currentTime), maxValue);
	const playLabel = playing ? t('Pause') : t('Play');
	const icon = playing ? 'pause-shape-filled' : 'play-shape-filled';

	if (compact) {
		return (
			<Box display='flex' alignItems='center' flexGrow={1} style={{ gap: 8 }}>
				<IconButton small primary icon={icon} onClick={onToggle} title={playLabel} aria-label={playLabel} />
				<Box flexGrow={1} minWidth={40}>
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
				<Box is='span' fontScale='c1' color='hint' style={{ fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right' }}>
					{`${formatPlaybackTime(currentTime)} / ${formatPlaybackTime(duration)}`}
				</Box>
				<Button secondary small onClick={onCyclePlaybackRate} aria-label={t('Playback_speed')}>
					{`${playbackRate}x`}
				</Button>
			</Box>
		);
	}

	// In-message player: visually identical to the original fuselage AudioPlayer.
	return (
		<Box
			borderWidth='default'
			bg='tint'
			borderColor='extra-light'
			pb={12}
			pie={8}
			pis={16}
			borderRadius='x4'
			w='100%'
			maxWidth='x300'
			display='flex'
			alignItems='center'
		>
			<IconButton primary medium icon={icon} onClick={onToggle} aria-label={playLabel} />
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
