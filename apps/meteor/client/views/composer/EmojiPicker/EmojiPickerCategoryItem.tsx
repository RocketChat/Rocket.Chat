import { IconButton } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import type { EmojiCategory } from '../../../../app/emoji/client';

type EmojiPickerCategoryItemProps = {
	category: EmojiCategory;
	active: boolean;
	handleGoToCategory: () => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const mapCategoryIcon = (category: string) => {
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
			return 'lamp-bulb';

		case 'symbols':
			return 'percentage';

		case 'flags':
			return 'flag';

		case 'rocket':
			return 'rocket';

		default:
			return 'clock';
	}
};

const EmojiPickerCategoryItem = ({ category, active, handleGoToCategory, ...props }: EmojiPickerCategoryItemProps) => {
	const { t } = useTranslation();

	const icon = mapCategoryIcon(category.key);

	return (
		<IconButton
			role='tab'
			pressed={active}
			title={t(category.i18n)}
			className={category.key}
			small
			aria-label={t(category.i18n)}
			onClick={handleGoToCategory}
			icon={icon}
			{...props}
		/>
	);
};

export default EmojiPickerCategoryItem;
