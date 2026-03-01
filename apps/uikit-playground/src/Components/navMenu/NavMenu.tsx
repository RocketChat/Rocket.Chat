import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useEffect, useState, useContext } from 'react';

import Menu from './Menu';
import { context, navMenuToggleAction } from '../../Context';

const NavMenu = () => {
	const [isOpen, setIsOpen] = useState(false);

	const {
		state: { navMenuToggle },
		dispatch,
	} = useContext(context);

	const toggleHandler = () => {
		setIsOpen(false);
		setTimeout(() => {
			dispatch(navMenuToggleAction(false));
		}, 300);
	};

	useEffect(() => {
		setIsOpen(navMenuToggle);
	}, [navMenuToggle]);

	return (
		<Box
			position='absolute'
			width='100%'
			height='100%'
			zIndex={3}
			bg={isOpen ? '#000000cc' : 'transparent'}
			className={css`
				user-select: none;
				transition: var(--animation-fast);
			`}
			overflow='hidden'
			onClick={toggleHandler}
		>
			<Menu isOpen={isOpen} />
		</Box>
	);
};

export default NavMenu;
