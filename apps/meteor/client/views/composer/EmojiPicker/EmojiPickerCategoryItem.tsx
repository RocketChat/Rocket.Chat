import { css } from '@rocket.chat/css-in-js';
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
		case 'activity':
			icon = 'ball';
			break;
		case 'flags':
			icon = 'flag';
			break;
		default:
			icon = 'clock';
	}

	return icon;
};

const EmojiPickerCategoryItem = ({ category, index, active, handleGoToCategory, ...props }: EmojiPickerCategoryItemProps) => {
	const t = useTranslation();

	const icon = mapCategoryIcon(category.key as TranslationKey);

	// const style = css`
	// 	cursor: pointer;
	// 	&:hover {
	// 		border-block-end-color: ${Palette.stroke['stroke-light']};
	// 	}
	// 	&:focus {
	// 		border: 1px solid ${Palette.stroke['stroke-dark']};
	// 		border-radius: 0.5rem;
	// 	}
	// `;

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
