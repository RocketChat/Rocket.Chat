import { css } from '@rocket.chat/css-in-js';
import type { AriaAttributes, RefAttributes } from 'react';
import { useMemo, useRef } from 'react';
import type { AriaSliderProps } from 'react-aria';
import { useNumberFormatter, useSlider } from 'react-aria';
import { useSliderState } from 'react-stately';

import { SliderHead } from './SliderHead';
import { SliderThumb } from './SliderThumb';
import { SliderTrack } from './SliderTrack';
import { useStyle } from '../../hooks/useStyle';

export type SliderProps<T extends number | number[]> = AriaAttributes &
	RefAttributes<HTMLDivElement> & {
		/**
		 * The display format of the value output.
		 */
		formatOptions?: Intl.NumberFormatOptions;
		/**
		 * The id of the slider input element, used to connect with an external label.
		 */
		id?: string;
		label?: string;
		showOutput?: boolean;
		/**
		 * Slider with multiple thumbs.
		 * @default false
		 */
		multiThumb?: T extends number[] ? true : false;
		step?: number;
		/**
		 * @default 0
		 */
		minValue?: number;
		/**
		 * @default 100
		 */
		maxValue?: number;
		orientation?: 'horizontal' | 'vertical';
		disabled?: boolean;
		defaultValue?: T;
	} & (
		| {
				value: T;
				onChange: (value: T) => void;
		  }
		| {
				value?: never;
				onChange?: never;
		  }
	);

function Slider<T extends number | [min: number, max: number]>({
	ref,
	...props
}: T extends number ? SliderProps<number> : SliderProps<[min: number, max: number]>) {
	const { label, formatOptions, showOutput = true, multiThumb, maxValue, minValue } = props;

	// Get a defaultValue in the range for multiThumb
	const getMultiThumbDefaultValue = (): T | undefined => {
		if (multiThumb && !props.defaultValue) {
			if (minValue && maxValue) {
				return [minValue, maxValue] as T;
			}
			if (minValue) {
				return [minValue, 100] as T;
			}
			if (maxValue) {
				return [0, maxValue] as T;
			}
			return [0, 100] as T;
		}

		return undefined;
	};

	const { defaultValue = getMultiThumbDefaultValue() } = props;

	const sliderProps = {
		...props,
		isDisabled: props.disabled,
	} as AriaSliderProps<number | number[]>;

	const trackRef = useRef<HTMLDivElement>(null);
	const numberFormatter = useNumberFormatter(formatOptions);
	const sliderState = useSliderState({
		defaultValue,
		...sliderProps,
		numberFormatter,
	});

	const { groupProps, trackProps, labelProps, outputProps } = useSlider(sliderProps, sliderState, trackRef);

	const isHorizontal = useMemo(() => sliderState.orientation === 'horizontal', [sliderState.orientation]);
	const isVertical = useMemo(() => sliderState.orientation === 'vertical', [sliderState.orientation]);

	const slider = useStyle(
		css`
			display: flex;
			${
				isHorizontal &&
				css`
					flex-direction: column;
					width: 100%;
				`
			};
			${
				isVertical &&
				css`
					flex-direction: row-reverse;
					height: 100%;
				`
			}
		`,
		sliderState,
	);

	return (
		<div {...groupProps} ref={ref} className={slider}>
			<SliderHead
				labelProps={labelProps}
				outputProps={outputProps}
				state={sliderState}
				showOutput={showOutput}
				label={label}
				multiThumb={multiThumb}
			/>
			<SliderTrack state={sliderState} trackProps={trackProps} trackRef={trackRef} multiThumb={multiThumb}>
				<SliderThumb index={0} state={sliderState} trackRef={trackRef} />
				{multiThumb && <SliderThumb index={1} state={sliderState} trackRef={trackRef} />}
			</SliderTrack>
		</div>
	);
}

export default Slider;
