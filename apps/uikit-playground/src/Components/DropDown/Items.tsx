import { css } from '@rocket.chat/css-in-js';
import { Box, Label, Chevron, useStyle } from '@rocket.chat/fuselage';
import { useState, useContext } from 'react';

import ItemsIcon from './ItemsIcon';
import { itemStyle, labelStyle } from './itemsStyle';
import type { ItemProps } from './types';
import { context, updatePayloadAction } from '../../Context';
import getUniqueId from '../../utils/getUniqueId';

const Items = ({ label, children, layer, payload }: ItemProps) => {
	const [isOpen, toggleItemOpen] = useState<boolean>(layer === 1);
	const [hover, setHover] = useState<boolean>(false);
	const { state, dispatch } = useContext(context);
	const labelClassName = useStyle(css`
		${labelStyle(layer, hover)}
	`);

	const itemClickHandler = () => {
		toggleItemOpen(!isOpen);
		if (!payload) return;
		dispatch(
			updatePayloadAction({
				blocks: [...state.screens[state.activeScreen].payload.blocks, { actionId: getUniqueId(), ...payload[0] }],
				changedByEditor: false,
			}),
		);
	};

	return (
		<Box marginBlockEnd={layer === 1 ? 'x8' : '0px'}>
			<Box
				display='flex'
				alignItems='center'
				color={hover ? 'pure-white' : 'secondary-info'}
				className={itemStyle(layer, hover)}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				onClick={itemClickHandler}
			>
				<Box size='x16' display='flex' alignItems='center'>
					{children && children.length > 0 && (
						<Box
							size='x16'
							display='flex'
							alignItems='center'
							className={css`
								transform: rotate(${!isOpen ? '-90deg' : '0deg'});
								transition: var(--animation-very-fast);
							`}
						>
							<Chevron size='x12' />
						</Box>
					)}
				</Box>
				<Box height='25px' display='flex' alignItems='center'>
					<ItemsIcon layer={layer} lastNode={children === undefined} />
					<Label className={labelClassName}>{label}</Label>
				</Box>
			</Box>
			<Box>{isOpen && children}</Box>
		</Box>
	);
};

export default Items;
