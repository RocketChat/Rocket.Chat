import { Story } from '@storybook/react';
import React, { useState } from 'react';

import { useFreePaidToggle } from '../hooks/useFreePaidToggle';
import FreePaidDropDown from './FreePaidDropDown';
import FreePaidDropDownAnchor from './FreePaidDropDownAnchor';
import FreePaidDropDownList from './FreePaidDropDownList';

export default {
	title: 'apps/components/FreePaidDropDown',
	component: FreePaidDropDownAnchor,
};

const testGroup = {
	label: 'Filter By Price',
	items: [
		{ id: 'all', label: 'All Apps', checked: true },
		{ id: 'free', label: 'Free Apps', checked: false },
		{ id: 'paid', label: 'Paid Apps', checked: false },
	],
};

export const Anchor: Story = () => <FreePaidDropDownAnchor group={testGroup} />;

export const List: Story = () => {
	const [data, setData] = useState(() => testGroup);

	const onSelected = useFreePaidToggle(setData);

	return <FreePaidDropDownList group={data} onSelected={onSelected} />;
};

export const Default: Story = () => {
	const [data, setData] = useState(() => testGroup);

	const onSelected = useFreePaidToggle(setData);

	return (
		<>
			<FreePaidDropDown group={data} onSelected={onSelected} />
		</>
	);
};
