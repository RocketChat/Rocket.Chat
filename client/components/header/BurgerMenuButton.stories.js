import { action } from '@storybook/addon-actions';
import { boolean, text } from '@storybook/addon-knobs/react';
import React from 'react';

import { BurgerMenuButton } from './BurgerMenuButton';

export default {
	title: 'header/BurgerMenuButton',
	component: BurgerMenuButton,
	decorators: [(fn) => <div style={{ margin: '1rem' }}>{fn()}</div>],
	parameters: {
		viewport: { defaultViewport: 'mobile1' },
	},
};

export const _default = () => <BurgerMenuButton
	isSidebarOpen={boolean('isSidebarOpen')}
	isLayoutEmbedded={boolean('isLayoutEmbedded')}
	unreadMessagesBadge={text('unreadMessagesBadge')}
	onClick={action('click')}
/>;

export const whenSidebarOpen = () => <BurgerMenuButton isSidebarOpen />;

export const unreadMessagesBadge = () => <BurgerMenuButton unreadMessagesBadge='99' />;
