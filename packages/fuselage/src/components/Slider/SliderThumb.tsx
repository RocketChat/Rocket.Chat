import { css } from '@rocket.chat/css-in-js';
import { useRef } from 'react';
import { mergeProps, useFocusRing, useSliderThumb, VisuallyHidden } from 'react-aria';

import { Palette } from '../../Theme';
import { useStyle } from '../../hooks/useStyle';

export const SliderThumb = (props: any) => {
	const { state, trackRef, index } = props;
	const inputRef = useRef<HTMLInputElement>(null);
	const { thumbProps, inputProps, isDragging } = useSliderThumb(
		{
			index,
			trackRef,
			inputRef,
		},
		state,
	);

	const { focusProps, isFocusVisible } = useFocusRing();

	const thumb = useStyle(
		css`
			width: 12px;
			height: 12px;

			cursor: ${state.isDisabled ? 'not-allowed' : 'pointer'};
			border-radius: 50%;
			background: ${isFocusVisible || isDragging ? Palette.text['font-info'] : Palette.stroke['stroke-highlight']};
			${
				state.orientation === 'horizontal'
					? css`
							top: 50%;
						`
					: css`
							left: 50%;
						`
			}
		`,
		{ isFocusVisible, isDragging },
	);
	return (
		<div {...thumbProps} className={thumb}>
			<VisuallyHidden>
				<input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
			</VisuallyHidden>
		</div>
	);
};
