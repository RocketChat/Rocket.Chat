import { Select } from '@rocket.chat/fuselage';
import React, { ComponentProps, forwardRef } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

const CategoryDropDownAnchor = forwardRef<HTMLElement, Partial<ComponentProps<typeof Select>> & { selectedCategoriesCount: number }>(
	function CategoryDropDownAnchor(props, ref) {
		const t = useTranslation();

		return (
			<Select
				ref={ref}
				placeholder={props.selectedCategoriesCount > 0 ? t('Categories*') : t('All_categories')}
				options={[]}
				onChange={(): number => 0}
				{...props}
			/>
		);
	},
);

export default CategoryDropDownAnchor;
