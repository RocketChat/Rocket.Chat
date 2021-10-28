import { Story } from '@storybook/react';
import React from 'react';

import CategoryDropDownAnchor from './CategoryDropDownAnchor';
import CategoryDropDownList from './CategoryDropDownList';

export default {
	title: 'apps/components/CategoryDropDown',
	component: CategoryDropDownAnchor,
};

const testGroup = [
	{
		label: 'teste',
		items: [
			{ id: '1', label: '🥒', checked: false },
			{ id: '2', label: '🍆', checked: true },
		],
	},
];

export const Default: Story = () => <CategoryDropDownAnchor />;
export const List: Story = () => (
	<CategoryDropDownList groups={testGroup} onSelected={console.log} />
);
