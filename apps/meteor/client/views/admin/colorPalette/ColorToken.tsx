import { Box, Button, Modal } from '@rocket.chat/fuselage';
import React, { ReactElement, useState } from 'react';

import ColorPicker from './ColorPicker';

type ColorTokenProps = {
	item: { name: string; token: string; color: string; isDark: boolean; rgb: string };
	position: number;
	disabled?: boolean;
};

const ColorToken = ({ item, position, ...props }: ColorTokenProps): ReactElement => {
	const [showColorPicker, setShowColorPicker] = useState(false);

	const closeColorPicker = (): void => setShowColorPicker(false);
	const openColorPicker = (): void => setShowColorPicker(true);

	return (
		<>
			{showColorPicker && (
				<Modal width='240px' height='320px' position='absolute'>
					<Modal.Header display='flex' justifyContent='flex-end'>
						<Modal.Close onClick={closeColorPicker} />
					</Modal.Header>
					<Box display='flex' justifyContent='center'>
						<ColorPicker {...props} item={item} />
					</Box>
					<Modal.Footer>
						<Modal.FooterControllers>
							<Button>Cancel</Button>
							<Button primary>Apply</Button>
						</Modal.FooterControllers>
					</Modal.Footer>
				</Modal>
			)}

			<Box
				width='120px'
				height='120px'
				backgroundColor={item.color}
				display='flex'
				flexDirection='column'
				justifyContent='space-between'
				flexShrink={0}
				m='x4'
				mis={position === 0 ? '0' : 'x4'}
				p='x8'
				fontSize='10px'
				color={item.isDark ? 'white' : 'black'}
				fontWeight='600'
				onClick={openColorPicker}
				style={{ cursor: 'pointer' }}
			>
				<Box>{item.name}</Box>
				<Box display='flex' justifyContent='space-between'>
					<Box>{item.color}</Box>
					<Box>{item.token}</Box>
				</Box>
			</Box>
		</>
	);
};

export default ColorToken;
