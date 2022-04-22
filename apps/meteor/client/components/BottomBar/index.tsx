import React, { ReactElement } from 'react';

import BlogButton from './BlogButton/BlogButton';

import GameButton from './GameButton/GameButton';

import HomeButton from './HomeButton/HomeButton';

import MessagesButton from './MessagesButton/MessagesButton';

import ProductButton from './ProductButton/ProductButton';

const BottomBar = (): ReactElement => {
	return (
		<div style={{ display: 'flex', width: '100%' }}>
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
		</div>
	);
};

export default BottomBar;
