import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { formatMediaTime } from '../../helpers/formatMediaTime';
import { Box } from '../Box';

const BAR_WIDTH = 3;
const MIN_BAR_GAP = 1;

/**
 * Picks how many bars to draw and the whole-pixel gap between them, so every gap
 * is equal: the narrowest gap that leaves less than one more bar of `width` unused.
 */
export const layoutBars = (width: number, maxBars: number): { count: number; gap: number } => {
	let best: { count: number; gap: number; slack: number } | undefined;

	for (let gap = MIN_BAR_GAP; ; gap++) {
		const count = Math.max(1, Math.min(maxBars, Math.floor((width + gap) / (BAR_WIDTH + gap))));
		const slack = width - count * BAR_WIDTH - (count - 1) * gap;

		if (!best || (slack >= 0 && slack < best.slack)) {
			best = { count, gap, slack };
		}

		if (slack < BAR_WIDTH + MIN_BAR_GAP || count < 2) {
			return { count: best.count, gap: best.gap };
		}
	}
};

/** Merges neighbouring peaks, keeping the loudest, so the waveform fits in `count` bars. */
export const fitPeaks = (peaks: number[], count: number): number[] => {
	if (count >= peaks.length) {
		return peaks;
	}

	return Array.from({ length: count }, (_, index) => {
		const start = Math.floor((index * peaks.length) / count);
		const end = Math.floor(((index + 1) * peaks.length) / count);
		return Math.max(...peaks.slice(start, end));
	});
};

const useInlineSize = () => {
	const [inlineSize, setInlineSize] = useState<number>();

	const ref = useCallback((element: HTMLElement | null) => {
		if (!element) {
			return;
		}

		setInlineSize(element.clientWidth);
		const observer = new ResizeObserver(([entry]) => setInlineSize(Math.floor(entry.contentRect.width)));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return [ref, inlineSize] as const;
};

export type AudioWaveformProps = {
	/** Normalised peak per bar, from 0 to 1. */
	'peaks': number[];
	'value': number;
	'maxValue': number;
	'onChange': (value: number) => void;
	'aria-label'?: string;
};

/**
 * Seek control drawn as the audio's waveform. A transparent native range input
 * covers the bars, so pointer, keyboard and screen readers behave like a slider.
 */
const AudioWaveform = ({ peaks, value, maxValue, onChange, 'aria-label': ariaLabel }: AudioWaveformProps) => {
	const [focusVisible, setFocusVisible] = useState(false);
	const progress = maxValue > 0 ? value / maxValue : 0;
	const [ref, inlineSize] = useInlineSize();
	const { count, gap } = useMemo(
		() => (inlineSize === undefined ? { count: peaks.length, gap: MIN_BAR_GAP } : layoutBars(inlineSize, peaks.length)),
		[inlineSize, peaks.length],
	);
	const bars = useMemo(() => fitPeaks(peaks, count), [peaks, count]);

	return (
		<Box
			ref={ref}
			position='relative'
			display='flex'
			flexGrow={1}
			alignItems='center'
			justifyContent='center'
			gap={gap}
			minWidth={0}
			height='x28'
			overflow='hidden'
		>
			{bars.map((peak, index) => (
				<Box
					is='span'
					key={index}
					aria-hidden
					flexShrink={0}
					width={BAR_WIDTH}
					borderRadius='full'
					height={`${Math.max(peak, 0.12) * 100}%`}
					backgroundColor={(index + 0.5) / bars.length <= progress ? 'badge-background-level-2' : 'badge-background-level-1'}
				/>
			))}
			{focusVisible && <Box position='absolute' inset={0} borderRadius='medium' borderWidth='medium' borderColor='highlight' aria-hidden />}
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
				max={maxValue || 0}
				step={1}
				value={Math.min(value, maxValue || 0)}
				aria-label={ariaLabel}
				aria-valuetext={formatMediaTime(value)}
				onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.currentTarget.value))}
				onFocus={(event: FocusEvent<HTMLElement>) => setFocusVisible(event.currentTarget.matches(':focus-visible'))}
				onBlur={() => setFocusVisible(false)}
			/>
		</Box>
	);
};

export default AudioWaveform;
