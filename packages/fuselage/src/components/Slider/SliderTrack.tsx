import { css } from '@rocket.chat/css-in-js';
import type { DOMAttributes, RefObject, ReactNode } from 'react';
import { useMemo } from 'react';
import type { SliderState } from 'react-stately';

import { Palette } from '../../Theme';
import { useStyle } from '../../hooks/useStyle';

type SliderTrackProps = {
	trackProps: DOMAttributes<Element>;
	trackRef: RefObject<HTMLDivElement | null>;
	state: SliderState;
	children: ReactNode;
	multiThumb?: boolean;
};

const highlight = Palette.stroke['stroke-highlight'];
const light = Palette.stroke['stroke-light'];

export const SliderTrack = ({ trackProps, trackRef, state, multiThumb, children }: SliderTrackProps) => {
	const isHorizontal = useMemo(() => state.orientation === 'horizontal', [state.orientation]);
	const isVertical = useMemo(() => state.orientation === 'vertical', [state.orientation]);

	const getThumbPosition = useMemo(
		() => (value: number) => {
			const maxValue = state.getThumbMaxValue(1) || state.getThumbMaxValue(0);
			const minValue = state.getThumbMinValue(0);
			return (value / (maxValue - minValue)) * 100;
		},
		[state],
	);

	const getTrackGradient = () => {
		if (isHorizontal) {
			return multiThumb
				? `to right, ${light} ${getThumbPosition(state.values[0])}%, ${highlight} 0, ${highlight} ${getThumbPosition(
						state.values[1],
					)}%, ${light} 0`
				: `to right, ${highlight}  ${getThumbPosition(state.values[0])}%, ${light} 0%`;
		}

		if (isVertical) {
			return multiThumb
				? `to top, ${light} ${getThumbPosition(state.values[0])}%, ${highlight} 0, ${highlight} ${getThumbPosition(
						state.values[1],
					)}%, ${light} 0`
				: `to top, ${highlight}  ${getThumbPosition(state.values[0])}%, ${light} 0%`;
		}

		return undefined;
	};

	const track = useStyle(
		css`
			&::before {
				position: absolute;
				display: block;
				content: '';

				background: linear-gradient(${getTrackGradient()});
				transform: translateX(-50%);
				border-radius: 1rem;
			}
			${
				isHorizontal &&
				css`
					width: 100%;
					height: 30px;
					&::before {
						top: 50%;
						width: 100%;
						height: 4px;
						transform: translateY(-50%);
					}
				`
			};
			${
				isVertical &&
				css`
					width: 30px;
					height: 100%;
					&::before {
						left: 50%;
						width: 4px;
						height: 100%;
					}
				`
			};
			${
				state.isDisabled &&
				css`
					cursor: not-allowed;
					opacity: 0.4;
				`
			};
		`,
		state,
	);

	return (
		<div {...trackProps} ref={trackRef} className={track}>
			{children}
		</div>
	);
};
