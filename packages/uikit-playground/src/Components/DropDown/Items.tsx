import { css } from '@rocket.chat/css-in-js';
import { Box, Label, Chevron } from '@rocket.chat/fuselage';
import { useState, useContext } from 'react';

import { context } from '../../Context';
import ItemsIcon from './ItemsIcon';
import { itemStyle, labelStyle } from './itemsStyle';
import type { ItemProps } from './types';
import { docAction } from '../../Context/action';

const Items = ({ label, children, layer, payload }: ItemProps) => {
	const [isOpen, toggleItemOpen] = useState<boolean>(layer === 1);
	const [hover, setHover] = useState<boolean>(false);
	const { state, dispatch } = useContext(context);

	const itemClickHandler = () => {
		toggleItemOpen(!isOpen);
		payload &&
			dispatch(
				docAction({
					payload: [...state.doc.payload, payload[0]],
					changedByEditor: false,
				}),
			);
	};

	return (
		<Box mbe={layer === 1 ? '10px' : '0px'}>
			<Box
				display='flex'
				alignItems='center'
				className={itemStyle(layer, hover)}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				onClick={itemClickHandler}
			>
				<Box size='x16' display='flex' alignItems='center'>
					{children && children.length > 0 && (
						<Box
							size='x16'
							display={'flex'}
							alignItems={'center'}
							className={css`
								transform: rotate(${!isOpen ? '-90deg' : '0deg'});
								transition: var(--animation-very-fast);
							`}
						>
							<Chevron width='12px' color={hover ? '#fff' : '#000'} />
						</Box>
					)}
				</Box>
				<Box height='25px' display='flex' alignItems='center'>
					<ItemsIcon layer={layer} hover={hover} lastNode={children === undefined} />
					<Label className={labelStyle(layer, hover)}>{label}</Label>
				</Box>
			</Box>
			<Box>{isOpen && children}</Box>
		</Box>
	);
};

export default Items;
