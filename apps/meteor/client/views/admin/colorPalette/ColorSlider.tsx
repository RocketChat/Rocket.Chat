import { useColorSlider } from '@react-aria/color';
import { useFocusRing } from '@react-aria/focus';
import { useLocale } from '@react-aria/i18n';
import { VisuallyHidden } from '@react-aria/visually-hidden';
import { useColorSliderState } from '@react-stately/color';
import { Box, Label } from '@rocket.chat/fuselage';
import React, { Dispatch, ReactElement, SetStateAction, useRef } from 'react';

import type { Color, ColorChannel } from './ColorArea';

const TRACK_THICKNESS = 28;
const THUMB_SIZE = 20;

type ColorSliderProps = {
	channel: ColorChannel;
	onChange?: Dispatch<SetStateAction<Color>>;
	onChangeEnd?: Dispatch<SetStateAction<Color>>;
	value: string | Color | undefined;
	label?: string;
};
const ColorSlider = (props: ColorSliderProps): ReactElement => {
	const { locale } = useLocale();
	const state = useColorSliderState({ ...props, locale });
	const trackRef = useRef<Element>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const label = props.label || state.value.getChannelName(props.channel, 'en-US');

	const { trackProps, thumbProps, inputProps, labelProps, outputProps } = useColorSlider(
		{
			...props,
			label,
			trackRef,
			inputRef,
		},
		state,
	);

	const { focusProps, isFocusVisible } = useFocusRing();

	return (
		<Box display='flex' flexDirection='column' alignItems='center' w='192'>
			<Box display='flex' alignSelf='stretch'>
				<Label {...labelProps}>{label}</Label>
				<Box {...outputProps} is='output' w='100%' textAlign='end'>
					{state.value.formatChannelValue(props.channel, locale)}
				</Box>
			</Box>
			<Box
				{...trackProps}
				ref={trackRef}
				style={{
					...trackProps.style,
					height: TRACK_THICKNESS,
					width: '100%',
					borderRadius: 4,
				}}
			>
				<div
					{...thumbProps}
					style={{
						...thumbProps.style,
						top: TRACK_THICKNESS / 2,
						border: '2px solid white',
						boxShadow: '0 0 0 1px black, inset 0 0 0 1px black',
						width: isFocusVisible ? TRACK_THICKNESS + 4 : THUMB_SIZE,
						height: isFocusVisible ? TRACK_THICKNESS + 4 : THUMB_SIZE,
						borderRadius: '50%',
						boxSizing: 'border-box',
						background: state.getDisplayColor().toString('css'),
					}}
				>
					<VisuallyHidden>
						<input ref={inputRef} {...inputProps} {...focusProps} />
					</VisuallyHidden>
				</div>
			</Box>
		</Box>
	);
};

export default ColorSlider;
