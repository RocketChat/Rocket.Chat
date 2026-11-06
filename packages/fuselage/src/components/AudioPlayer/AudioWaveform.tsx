import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { Box } from '../Box';

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

	return (
		<Box position='relative' display='flex' flexGrow={1} alignItems='center' justifyContent='space-between' minWidth={0} height='x28'>
			{peaks.map((peak, index) => (
				<Box
					is='span'
					key={index}
					aria-hidden
					flexGrow={1}
					flexShrink={1}
					flexBasis={0}
					minWidth='x1'
					maxWidth='x3'
					borderRadius='full'
					height={`${Math.max(peak, 0.12) * 100}%`}
					backgroundColor={(index + 0.5) / peaks.length <= progress ? 'badge-background-level-2' : 'neutral'}
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
				onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.currentTarget.value))}
				onFocus={(event: FocusEvent<HTMLElement>) => setFocusVisible(event.currentTarget.matches(':focus-visible'))}
				onBlur={() => setFocusVisible(false)}
			/>
		</Box>
	);
};

export default AudioWaveform;
