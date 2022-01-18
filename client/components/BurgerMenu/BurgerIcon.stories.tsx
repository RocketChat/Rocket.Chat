import { Story } from '@storybook/react';
import React from 'react';

import { centeredDecorator } from '../../../.storybook/decorators';
import { useAutoToggle } from '../../../.storybook/hooks';
import BurgerIcon from './BurgerIcon';

export default {
	title: 'components/burger/BurgerIcon',
	component: BurgerIcon,
	decorators: [centeredDecorator],
};

export const Normal: Story = () => <BurgerIcon />;

export const Open: Story = () => <BurgerIcon open />;

export const Transitioning: Story = () => <BurgerIcon open={useAutoToggle()} />;
