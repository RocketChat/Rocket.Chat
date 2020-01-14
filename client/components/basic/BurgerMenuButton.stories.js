import { action } from '@storybook/addon-actions';
import { boolean, text } from '@storybook/addon-knobs/react';
import React from 'react';

import { BurgerMenuButton } from './BurgerMenuButton';
import { SidebarContext } from '../../contexts/SidebarContext';
import { SessionContext } from '../../contexts/SessionContext';

export default {
	title: 'basic/BurgerMenuButton',
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
_default.story = {
	decorators: [
		(fn) => <SidebarContext.Provider children={fn()} value={[false, action('setSidebarOpen')]} />,
	],
};

export const whenSidebarOpen = () => <BurgerMenuButton />;
whenSidebarOpen.story = {
	decorators: [
		(fn) => <SidebarContext.Provider children={fn()} value={[true, action('setSidebarOpen')]} />,
	],
};

export const unreadMessagesBadge = () => <BurgerMenuButton />;
unreadMessagesBadge.story = {
	decorators: [
		(fn) => <SessionContext.Provider value={{
			get: (name) => name === 'unread' && '99',
		}}>
			<SidebarContext.Provider children={fn()} value={[false, action('setSidebarOpen')]} />
		</SessionContext.Provider>,
	],
};
