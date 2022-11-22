import { parseColor } from '@react-stately/color';
import { Box, Button, Dropdown, Input } from '@rocket.chat/fuselage';
import { useOutsideClick, useToggle } from '@rocket.chat/fuselage-hooks';
import { isHexColor } from '@rocket.chat/ui-theming/src/isHexColor';
import { isLightColor } from '@rocket.chat/ui-theming/src/isLightColor';
import React, { ReactElement, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import ColorArea from './ColorArea';
import ColorSlider from './ColorSlider';

type ColorTokenProps = {
	name: string;
	token: string;
	position: number;
	disabled?: boolean;
	value: string;
	onChange: (e: any) => void;
};

const ColorToken = ({ name, token, value, onChange }: ColorTokenProps): ReactElement => {
	const reference = useRef(null);
	const target = useRef(null);
	const [isVisible, toggle] = useToggle(false);

	const [isTyping, setIsTyping] = useState(false);
	const [input, setInput] = useState(value);
	const [color, setColor] = useState(parseColor(value).toFormat('hsba'));
	const [xChannel, yChannel, zChannel] = color.getColorChannels();

	const openColorPicker = (): void => toggle(true);
	const closeColorPicker = useCallback((): void => {
		setColor(parseColor(value).toFormat('hsba'));
		toggle(false);
	}, [value, toggle]);

	const applyColor = (): void => {
		onChange(color.toString('hex'));
		toggle(false);
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
					<Dropdown reference={reference} ref={target} key={name}>
						<Box pi='x16'>
							<Box fontSize='p2b' fontWeight='p2b' display='flex' justifyContent='center'>
								{name}
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
				key={name}
				ref={reference}
				width='120px'
				height='120px'
				backgroundColor={color.toString('rgb')}
				display='flex'
				flexDirection='column'
				justifyContent='space-between'
				flexShrink={0}
				m='x4'
				p='x8'
				fontSize='10px'
				color={isLightColor(color.toString('hex')) ? 'black' : 'white'}
				fontWeight='600'
				onClick={openColorPicker}
				style={{ cursor: 'pointer' }}
			>
				<input type='hidden' name={name} onChange={onChange} value={color.toString('rgb')} />
				<Box>{name}</Box>
				<Box display='flex' justifyContent='space-between'>
					<Box>{color.toString('hex')}</Box>
					<Box>{token}</Box>
				</Box>
			</Box>
		</>
	);
};

export default ColorToken;
