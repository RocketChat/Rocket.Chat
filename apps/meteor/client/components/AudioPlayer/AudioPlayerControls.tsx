import { Box, IconButton, Slider } from '@rocket.chat/fuselage';
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

	return (
		<Box display='flex' alignItems='center' flexGrow={1} style={{ gap: compact ? 8 : 10 }}>
			<IconButton
				small={compact}
				primary
				icon={playing ? 'pause' : 'play'}
				onClick={onToggle}
				title={playing ? t('Pause') : t('Play')}
				aria-label={playing ? t('Pause') : t('Play')}
			/>
			{!compact && (
				<Box is='span' fontScale='c1' color='default' style={{ fontVariantNumeric: 'tabular-nums', minWidth: 34 }}>
					{formatPlaybackTime(currentTime)}
				</Box>
			)}
			<Box flexGrow={1} minWidth={40}>
				<Slider
					aria-label={t('Seek')}
					minValue={0}
					maxValue={maxValue || 1}
					step={1}
					value={value}
					onChange={(next) => onSeek(Array.isArray(next) ? next[0] : next)}
				/>
			</Box>
			<Box is='span' fontScale='c1' color='hint' style={{ fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right' }}>
				{compact ? `${formatPlaybackTime(currentTime)} / ${formatPlaybackTime(duration)}` : formatPlaybackTime(duration)}
			</Box>
			<Box
				is='button'
				type='button'
				onClick={onCyclePlaybackRate}
				title={t('Playback_speed')}
				aria-label={t('Playback_speed')}
				fontScale='c2'
				color='default'
				pi={8}
				style={{
					flex: 'none',
					height: compact ? 24 : 30,
					borderRadius: 6,
					border: '1px solid var(--rcx-color-stroke-light)',
					background: 'var(--rcx-color-surface-tint)',
					cursor: 'pointer',
				}}
			>
				{`${playbackRate}x`}
			</Box>
		</Box>
	);
};

export default AudioPlayerControls;
