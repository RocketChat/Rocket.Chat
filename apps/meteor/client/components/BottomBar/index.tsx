import React, { ReactElement } from 'react';

import BlogButton from './BlogButton/BlogButton';
import GameButton from './GameButton/GameButton';
import HomeButton from './HomeButton/HomeButton';
import MessagesButton from './MessagesButton/MessagesButton';
import ProductButton from './ProductButton/ProductButton';
import BurgerMenu from './BurgerMenu';

const BottomBar = (): ReactElement => (
	<div style={{ display: 'flex', width: '100%', height: '70px' }}>
		<div className='rc-header__navbar-item'>
			<HomeButton />
		</div>
		<div className='rc-header__navbar-item'>
			<BlogButton />
		</div>
		<div className='rc-header__navbar-item'>
			<GameButton />
		</div>
		<div className='rc-header__navbar-item'>
			<ProductButton />
		</div>
		<div className='rc-header__navbar-item'>
			<MessagesButton />
		</div>
		<div className='rc-header__navbar-item'>
			<BurgerMenu />
		</div>
	</div>
);

export default BottomBar;
