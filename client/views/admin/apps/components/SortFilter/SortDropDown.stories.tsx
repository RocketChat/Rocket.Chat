import { Story } from '@storybook/react';
import React, { useState } from 'react';

import { useRadioToggle } from '../../hooks/useRadioToggle';
import RadioButtonList from '../RadioButtonList';
import SortDropDown from './SortDropDown';
import SortDropDownAnchor from './SortDropDownAnchor';

export default {
	title: 'apps/components/FreePaidDropDown',
	component: SortDropDownAnchor,
};

const testGroup = {
	label: 'Sort by',
	items: [
		{ id: 'az', label: 'A-Z', checked: true },
		{ id: 'za', label: 'Z-A', checked: false },
		{ id: 'MRU', label: 'Most recent updated', checked: false },
		{ id: 'LRU', label: 'Least recent updated', checked: false },
	],
};

export const Anchor: Story = () => <SortDropDownAnchor group={testGroup} />;

export const List: Story = () => {
	const [data, setData] = useState(() => testGroup);

	const onSelected = useRadioToggle(setData);

	return <RadioButtonList group={data} onSelected={onSelected} />;
};

export const Default: Story = () => {
	const [data, setData] = useState(() => testGroup);

	const onSelected = useRadioToggle(setData);

	return (
		<>
			<SortDropDown group={data} onSelected={onSelected} />
		</>
	);
};
