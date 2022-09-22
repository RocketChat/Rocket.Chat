import { useColorArea } from '@react-aria/color';
import { useFocusRing } from '@react-aria/focus';
import { useColorAreaState } from '@react-stately/color';
import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

type ColorTokenProps = {
	item: { name: string; token: string; color: string; isDark: boolean; rgb: string };
	position: number;
	disabled?: boolean;
	// defaultValue?: string;
};

const FOCUSED_THUMB_SIZE = 28;
const THUMB_SIZE = 20;

const ColorToken = ({ item, position, disabled, ...props }: ColorTokenProps): ReactElement => {
	const inputXRef = React.useRef(null);
	const inputYRef = React.useRef(null);
	const containerRef = React.useRef(null);

	const defaultValue = item.rgb;

	const state = useColorAreaState({ defaultValue, ...props });

	const { colorAreaProps, gradientProps, xInputProps, yInputProps, thumbProps } = useColorArea(
		{ ...props, defaultValue, inputXRef, inputYRef, containerRef },
		state,
	);

	console.log(gradientProps, xInputProps, yInputProps, colorAreaProps);

	const { focusProps, isFocusVisible } = useFocusRing();
	return (
		<Box
			ref={containerRef}
			{...colorAreaProps}
			style={{
				...colorAreaProps.style,
				backgroundImage: item.color,
				opacity: disabled ? 0.3 : undefined,
			}}
			width='120px'
			height='120px'
			backgroundColor={item.color}
			display='flex'
			flexDirection='column'
			justifyContent='space-between'
			flexShrink={0}
			m='x8'
			mis={position === 0 ? '0' : 'x4'}
			fontSize='10px'
			color={item.isDark ? 'white' : 'black'}
			fontWeight='600'
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
		// <Box
		// 	width='120px'
		// 	height='120px'
		// 	backgroundColor={item.color}
		// 	display='flex'
		// 	flexDirection='column'
		// 	justifyContent='space-between'
		// 	flexShrink={0}
		// 	m='x4'
		// 	mis={position === 0 ? '0' : 'x4'}
		// 	p='x8'
		// 	fontSize='10px'
		// 	color={item.isDark ? 'white' : 'black'}
		// 	fontWeight='600'
		// >
		// 	<Box>{item.name}</Box>
		// 	<Box display='flex' justifyContent='space-between'>
		// 		<Box>{item.color}</Box>
		// 		<Box>{item.token}</Box>
		// 	</Box>
		// </Box>
	);
};

export default ColorToken;
