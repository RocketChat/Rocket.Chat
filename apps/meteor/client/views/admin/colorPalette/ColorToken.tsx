import { parseColor } from '@react-stately/color';
import { Box, Button, Dropdown, Input } from '@rocket.chat/fuselage';
import { useOutsideClick, useToggle } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import ColorArea from './ColorArea';
import ColorSlider from './ColorSlider';

type ColorTokenProps = {
	item: { name: string; token: string; color: string; isDark: boolean; rgb: string };
	position: number;
	disabled?: boolean;
};

const ColorToken = ({ item, position }: ColorTokenProps): ReactElement => {
	const reference = useRef(null);
	const target = useRef(null);
	const [isVisible, toggle] = useToggle(false);

	const [isTyping, setIsTyping] = useState(false);
	const [input, setInput] = useState(item.color);
	const [color, setColor] = useState(parseColor(item.rgb).toFormat('hsba'));
	const [xChannel, yChannel, zChannel] = color.getColorChannels();

	const openColorPicker = (): void => toggle(true);
	const closeColorPicker = useCallback((): void => {
		setColor(parseColor(item.rgb).toFormat('hsba'));
		toggle(false);
	}, [item.rgb, toggle]);

	const applyColor = (): void => toggle(false);

	const isHexColor = (hex: string): boolean => typeof hex === 'string' && hex.length === 6 && !isNaN(Number(`0x${hex}`));
	const isLightColor = (color: string): boolean => {
		const hex = color.replace('#', '');
		const r = parseInt(hex.substring(0, 0 + 2), 16);
		const g = parseInt(hex.substring(2, 2 + 2), 16);
		const b = parseInt(hex.substring(4, 4 + 2), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 155;
	};
	const handleInputChange = (e: SyntheticEvent): void => {
		setIsTyping(true);
		const value = (e.target as HTMLInputElement).value.toUpperCase();
		setInput(value);
	};

	useOutsideClick(
		[target, reference],
		useCallback(() => closeColorPicker(), [closeColorPicker]),
	);

	useEffect(() => {
		isTyping && isHexColor(input.replace(/^#/, '')) && setColor(parseColor(input).toFormat('hsba'));
		setIsTyping(false);
	}, [input, isTyping]);

	useEffect(() => {
		setInput(color.toString('hex'));
	}, [color]);

	return (
		<>
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target} key={item.name}>
						<Box pi='x16'>
							<Box fontSize='p2b' fontWeight='p2b' display='flex' justifyContent='center'>
								{item.name}
							</Box>
							<Box display='flex' justifyContent='center' flexDirection='column' mb='x8'>
								<ColorArea aria-labelledby='hsb-label-id-1' value={color} onChange={setColor} xChannel={xChannel} yChannel={yChannel} />
								<ColorSlider channel={zChannel} value={color} onChange={setColor} />
								<Input mbs='x8' value={input} onChange={handleInputChange} />
							</Box>
							<Box display='flex' justifyContent='space-between'>
								<Button onClick={closeColorPicker}>Cancel</Button>
								<Button primary onClick={applyColor}>
									Apply
								</Button>
							</Box>
						</Box>
					</Dropdown>,
					document.body,
				)}

			<Box
				key={item.name}
				ref={reference}
				width='120px'
				height='120px'
				backgroundColor={color.toString('rgb')}
				display='flex'
				flexDirection='column'
				justifyContent='space-between'
				flexShrink={0}
				m='x4'
				mis={position === 0 ? '0' : 'x4'}
				p='x8'
				fontSize='10px'
				color={isLightColor(color.toString('hex')) ? 'black' : 'white'}
				fontWeight='600'
				onClick={openColorPicker}
				style={{ cursor: 'pointer' }}
			>
				<Box>{item.name}</Box>
				<Box display='flex' justifyContent='space-between'>
					<Box>{color.toString('hex')}</Box>
					<Box>{item.token}</Box>
				</Box>
			</Box>
		</>
	);
};

export default ColorToken;
