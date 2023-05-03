import { Box, Palette, IconButton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import type { EmojiCategory } from '../../../../app/emoji/client';

type EmojiPickerCategoryItemProps = {
	category: EmojiCategory;
	index: number;
	active: boolean;
	handleGoToCategory: (categoryIndex: number) => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const mapCategoryIcon = (category: string) => {
	let icon: TranslationKey;
	switch (category) {
		case 'people':
			icon = 'emoji';
			break;
		case 'nature':
			icon = 'leaf';
			break;
		case 'food':
			icon = 'burger';
			break;
		case 'activity':
			icon = 'ball';
			break;
		case 'travel':
			icon = 'airplane';
			break;
		case 'objects':
			icon = 'percentage';
			break;
		case 'symbols':
			icon = 'lamp-bulb';
			break;
		case 'flags':
			icon = 'flag';
			break;
		case 'rocket':
			icon = 'rocket';
			break;
		default:
			icon = 'clock';
	}

	return icon;
};

const EmojiPickerCategoryItem = ({ category, index, active, handleGoToCategory, ...props }: EmojiPickerCategoryItemProps) => {
	const t = useTranslation();

	const icon = mapCategoryIcon(category.key as TranslationKey);

	return (
		<IconButton
			pressed={active}
			title={t(category.i18n)}
			className={category.key}
			small
			aria-label={t(category.i18n)}
			onClick={() => handleGoToCategory(index)}
			icon={icon}
			{...props}
		/>
	);

	return (
		<Box tabIndex={0} role='tab'>
			<i
				style={{ fontSize: '20px', ...(active && { color: Palette.statusColor['status-font-on-info'].toString() }) }}
				className={`category-icon icon-${category.key}`}
			></i>
		</Box>
	);
};

export default EmojiPickerCategoryItem;
