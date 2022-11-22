import { useColorArea } from '@react-aria/color';
import { useFocusRing } from '@react-aria/focus';
import { useColorAreaState } from '@react-stately/color';
import React, { Dispatch, ReactElement, SetStateAction } from 'react';

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

export type Color = {
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

export type ColorChannel = 'hue' | 'saturation' | 'brightness' | 'lightness' | 'red' | 'green' | 'blue' | 'alpha';

type ColorAreaProps = {
	isDisabled?: boolean;
	value: string | Color | undefined;
	onChange?: Dispatch<SetStateAction<Color>>;
	onChangeEnd?: Dispatch<SetStateAction<Color>>;
	xChannel?: ColorChannel;
	yChannel?: ColorChannel;
};

const SIZE = 192;
const FOCUSED_THUMB_SIZE = 28;
const THUMB_SIZE = 20;
const BORDER_RADIUS = 4;

const ColorArea = (props: ColorAreaProps): ReactElement => {
	const inputXRef = React.useRef(null);
	const inputYRef = React.useRef(null);
	const containerRef = React.useRef(null);

	const state = useColorAreaState(props);

	const { isDisabled } = props;

	const { colorAreaProps, gradientProps, xInputProps, yInputProps, thumbProps } = useColorArea(
		{ ...props, inputXRef, inputYRef, containerRef },
		state,
	);

	const { focusProps, isFocusVisible } = useFocusRing();

	return (
		<div
			ref={containerRef}
			{...colorAreaProps}
			style={{
				...colorAreaProps.style,
				width: SIZE,
				height: SIZE,
				borderRadius: BORDER_RADIUS,
				opacity: isDisabled ? 0.3 : undefined,
			}}
		>
			<div
				{...gradientProps}
				style={{
					backgroundColor: isDisabled ? 'rgb(142, 142, 142)' : undefined,
					...gradientProps.style,
					borderRadius: BORDER_RADIUS,
					height: SIZE,
					width: SIZE,
				}}
			/>
			<div
				{...thumbProps}
				style={{
					...thumbProps.style,
					background: isDisabled ? 'rgb(142, 142, 142)' : state.getDisplayColor().toString('css'),
					border: `2px solid ${isDisabled ? 'rgb(142, 142, 142)' : 'white'}`,
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
		</div>
	);
};

export default ColorArea;
