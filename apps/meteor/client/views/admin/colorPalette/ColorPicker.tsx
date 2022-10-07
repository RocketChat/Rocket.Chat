import { useColorArea } from '@react-aria/color';
import { useColorAreaState } from '@react-stately/color';
import { Box } from '@rocket.chat/fuselage';
import React, { Dispatch, ReactElement, SetStateAction } from 'react';
import { useFocusRing } from 'react-aria';

type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba';
type ColorAxes = { xChannel: ColorChannel; yChannel: ColorChannel; zChannel: ColorChannel };
interface ColorChannelRange {
	/** The minimum value of the color channel. */
	minValue: number;
	/** The maximum value of the color channel. */
	maxValue: number;
	/** The step value of the color channel, used when incrementing and decrementing. */
	step: number;
	/** The page step value of the color channel, used when incrementing and decrementing. */
	pageSize: number;
}

type Color = {
	/** Converts the color to the given color format, and returns a new Color object. */
	toFormat(format: ColorFormat): Color;
	/** Converts the color to a string in the given format. */
	toString(format: ColorFormat | 'css'): string;
	/** Converts the color to hex, and returns an integer representation. */
	toHexInt(): number;
	/**
	 * Returns the numeric value for a given channel.
	 * Throws an error if the channel is unsupported in the current color format.
	 */
	getChannelValue(channel: ColorChannel): number;
	/**
	 * Sets the numeric value for a given channel, and returns a new Color object.
	 * Throws an error if the channel is unsupported in the current color format.
	 */
	withChannelValue(channel: ColorChannel, value: number): Color;
	/**
	 * Returns the minimum, maximum, and step values for a given channel.
	 */
	getChannelRange(channel: ColorChannel): ColorChannelRange;
	/**
	 * Returns a localized color channel name for a given channel and locale,
	 * for use in visual or accessibility labels.
	 */
	getChannelName(channel: ColorChannel, locale: string): string;
	/**
	 * Formats the numeric value for a given channel for display according to the provided locale.
	 */
	formatChannelValue(channel: ColorChannel, locale: string): string;
	/**
	 * Returns the color space, 'rgb', 'hsb' or 'hsl', for the current color.
	 */
	getColorSpace(): ColorFormat;
	/**
	 * Returns the color space axes, xChannel, yChannel, zChannel.
	 */
	getColorSpaceAxes(xyChannels: { xChannel?: ColorChannel; yChannel?: ColorChannel }): ColorAxes;
	/**
	 * Returns an array of the color channels within the current color space space.
	 */
	getColorChannels(): [ColorChannel, ColorChannel, ColorChannel];
};

type ColorChannel = 'hue' | 'saturation' | 'brightness' | 'lightness' | 'red' | 'green' | 'blue' | 'alpha';

type ColorPickerProps = {
	item: { name: string; token: string; color: string; isDark: boolean; rgb: string };
	disabled?: boolean;
	value?: any;
	onChange?: Dispatch<SetStateAction<Color>>;
	onChangeEnd?: Dispatch<SetStateAction<Color>>;
	xChannel?: ColorChannel;
	yChannel?: ColorChannel;
};

const FOCUSED_THUMB_SIZE = 28;
const THUMB_SIZE = 20;

const ColorPicker = ({ item, disabled, ...props }: ColorPickerProps): ReactElement => {
	const inputXRef = React.useRef(null);
	const inputYRef = React.useRef(null);
	const containerRef = React.useRef(null);

	const defaultValue = item.rgb;

	const state = useColorAreaState({ defaultValue, ...props });

	const { colorAreaProps, gradientProps, xInputProps, yInputProps, thumbProps } = useColorArea(
		{ ...props, defaultValue, inputXRef, inputYRef, containerRef },
		state,
	);

	const { focusProps, isFocusVisible } = useFocusRing();

	return (
		<Box
			ref={containerRef}
			{...colorAreaProps}
			style={{
				...colorAreaProps.style,
				opacity: disabled ? 0.3 : undefined,
			}}
			width='120px'
			height='120px'
		>
			<div
				{...gradientProps}
				style={{
					backgroundColor: disabled ? 'rgb(142, 142, 142)' : undefined,
					...gradientProps.style,
				}}
			/>
			<div
				{...thumbProps}
				style={{
					...thumbProps.style,
					background: disabled ? 'rgb(142, 142, 142)' : state.getDisplayColor().toString('css'),
					border: `2px solid ${disabled ? 'rgb(142, 142, 142)' : 'white'}`,
					borderRadius: '50%',
					boxShadow: '0 0 0 1px black, inset 0 0 0 1px black',
					boxSizing: 'border-box',
					height: isFocusVisible ? FOCUSED_THUMB_SIZE + 4 : THUMB_SIZE,
					transform: 'translate(-50%, -50%)',
					width: isFocusVisible ? FOCUSED_THUMB_SIZE + 4 : THUMB_SIZE,
				}}
			>
				<input ref={inputXRef} {...xInputProps} {...focusProps} />
				<input ref={inputYRef} {...yInputProps} {...focusProps} />
			</div>
		</Box>
	);
};

export default ColorPicker;
