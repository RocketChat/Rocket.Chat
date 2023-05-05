import { IconButton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';
import React from 'react';

import type { EmojiCategory } from '../../../../app/emoji/client';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';

type EmojiPickerCategoryItemProps = {
	category: EmojiCategory;
	index: number;
	active: boolean;
	handleGoToCategory: (categoryIndex: number) => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const mapCategoryIcon = (category: string): TranslationKey => {
	switch (category) {
		case 'people':
			return 'emoji';

		case 'nature':
			return 'leaf';

		case 'food':
			return 'burger';

		case 'activity':
			return 'ball';

		case 'travel':
			return 'airplane';

		case 'objects':
			return 'percentage';

		case 'symbols':
			return 'lamp-bulb';

		case 'flags':
			return 'flag';

		case 'rocket':
			return 'rocket';

		default:
			return 'clock';
	}
};

const EmojiPickerCategoryItem = ({ category, index, active, handleGoToCategory, ...props }: EmojiPickerCategoryItemProps) => {
	const t = useTranslation();

	const icon = mapCategoryIcon(category.key as TranslationKey);

	return (
		<IconButton
			role='tab'
			pressed={active}
			title={t(category.i18n)}
			className={category.key}
			small
			aria-label={t(category.i18n)}
			components={{ Scroller: ScrollableContentWrapper }}
			onClick={() => handleGoToCategory(index)}
			icon={icon}
			{...props}
		/>
	);
};

export default EmojiPickerCategoryItem;
