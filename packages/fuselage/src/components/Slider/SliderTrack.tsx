import type { CSSProperties, HTMLAttributes, RefObject, ReactNode } from 'react';
import { useMemo } from 'react';
import type { SliderState } from 'react-stately';

type SliderTrackProps = {
	trackProps: HTMLAttributes<Element>;
	trackRef: RefObject<HTMLDivElement | null>;
	state: SliderState;
	children: ReactNode;
	multiThumb?: boolean;
};

export const SliderTrack = ({ trackProps, trackRef, state, multiThumb, children }: SliderTrackProps) => {
	const getThumbPosition = useMemo(
		() => (value: number) => {
			const maxValue = state.getThumbMaxValue(1) || state.getThumbMaxValue(0);
			const minValue = state.getThumbMinValue(0);
			return (value / (maxValue - minValue)) * 100;
		},
		[state],
	);

	const track = [
		'rcx-slider__track',
		`rcx-slider__track--${state.orientation}`,
		multiThumb ? 'rcx-slider__track--multi' : 'rcx-slider__track--single',
		state.isDisabled && 'rcx-slider__track--disabled',
	]
		.filter(Boolean)
		.join(' ');

	const style = {
		'--slider-start': `${getThumbPosition(state.values[0])}%`,
		'--slider-end': `${getThumbPosition(state.values[1])}%`,
	} as CSSProperties;

	return (
		<div {...trackProps} ref={trackRef} className={track} style={{ ...trackProps.style, ...style }}>
			{children}
		</div>
	);
};
