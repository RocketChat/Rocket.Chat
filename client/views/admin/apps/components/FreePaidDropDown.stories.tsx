import { Story } from '@storybook/react';
import React, { useState } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useFreePaidToggle } from '../hooks/useFreePaidToggle';
import FreePaidDropDown from './FreePaidDropDown';
import FreePaidDropDownAnchor from './FreePaidDropDownAnchor';
import FreePaidDropDownList from './FreePaidDropDownList';

export default {
	title: 'apps/components/FreePaidDropDown',
	component: FreePaidDropDownAnchor,
};

export const Anchor: Story = () => <FreePaidDropDownAnchor />;

export const List: Story = () => {
	const t = useTranslation();

	const testGroup = {
		label: 'Filter By Price',
		items: [
			{ id: 'all', label: t('All_Apps'), checked: false },
			{ id: 'free', label: t('Free_Apps'), checked: false },
			{ id: 'paid', label: t('Paid_Apps'), checked: false },
		],
	};
	const [data, setData] = useState(() => testGroup);

	const onSelected = useFreePaidToggle(setData);

	return <FreePaidDropDownList group={data} onSelected={onSelected} />;
};

export const Default: Story = () => {
	const t = useTranslation();

	const testGroup = {
		label: 'Filter By Price',
		items: [
			{ id: 'all', label: t('All_Apps'), checked: false },
			{ id: 'free', label: t('Free_Apps'), checked: false },
			{ id: 'paid', label: t('Paid_Apps'), checked: false },
		],
	};

	const [data, setData] = useState(() => testGroup);

	const onSelected = useFreePaidToggle(setData);

	return (
		<>
			<FreePaidDropDown group={data} onSelected={onSelected} />
		</>
	);
};
