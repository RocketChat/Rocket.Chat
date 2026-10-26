import { useRef } from 'react';
import { mergeProps, useFocusRing, useSliderThumb, VisuallyHidden } from 'react-aria';

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

	const thumb = [
		'rcx-slider__thumb',
		`rcx-slider__thumb--${state.orientation}`,
		state.isDisabled && 'rcx-slider__thumb--disabled',
		(isFocusVisible || isDragging) && 'rcx-slider__thumb--active',
	]
		.filter(Boolean)
		.join(' ');
	return (
		<div {...thumbProps} className={thumb}>
			<VisuallyHidden>
				<input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
			</VisuallyHidden>
		</div>
	);
};
