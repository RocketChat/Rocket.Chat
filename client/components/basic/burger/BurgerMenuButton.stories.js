import { action } from '@storybook/addon-actions';
import React from 'react';

import { centeredDecorator } from '../../../../.storybook/decorators';
import { SidebarContext } from '../../../contexts/SidebarContext';
import { SessionContext } from '../../../contexts/SessionContext';
import BurgerMenuButton from './BurgerMenuButton';

const stateDecorator = ({
	isSidebarOpen = false,
	unreadMessagesBadge = null,
} = {}) =>
	(storyFn) =>
		<SessionContext.Provider value={{
			get: (name) => name === 'unread' && unreadMessagesBadge,
		}}>
			<SidebarContext.Provider children={storyFn()} value={[isSidebarOpen, action('setSidebarOpen')]} />
		</SessionContext.Provider>;

export default {
	title: 'components/basic/burger/BurgerMenuButton',
	component: BurgerMenuButton,
	decorators: [
		centeredDecorator,
	],
	parameters: {
		viewport: {
			defaultViewport: 'mobile1',
		},
	},
};

export const Basic = () => <BurgerMenuButton />;
Basic.story = {
	decorators: [
		stateDecorator(),
	],
};

export const WhenSidebarIsOpen = () => <BurgerMenuButton />;
WhenSidebarIsOpen.story = {
	decorators: [
		stateDecorator({ isSidebarOpen: true }),
	],
};

export const WithUnreadMessagesBadge = () => <BurgerMenuButton />;
WithUnreadMessagesBadge.story = {
	decorators: [
		stateDecorator({ unreadMessagesBadge: '99' }),
	],
};
