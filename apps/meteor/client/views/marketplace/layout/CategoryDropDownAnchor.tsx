import type { Button } from '@rocket.chat/fuselage';
import { Badge, Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEventHandler } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export type CategoryDropDownAnchorProps = { selectedCategoriesCount: number; onClick?: MouseEventHandler<HTMLElement> } & ComponentProps<
	typeof Button
>;

/**
 * The button that opens the marketplace category filter, with a count of the selected categories.
 */
const CategoryDropDownAnchor = forwardRef<HTMLElement, CategoryDropDownAnchorProps>(function CategoryDropDownAnchor(
	{ onClick, selectedCategoriesCount, ...props },
	ref,
) {
	const { t } = useTranslation();
	const hasSelection = selectedCategoriesCount > 0;

	return (
		<Box
			is='button'
			ref={ref}
			onClick={onClick}
			aria-label={hasSelection ? t('Categories_selected', { count: selectedCategoriesCount }) : undefined}
			alignItems='center'
			backgroundColor='light'
			borderColor='light'
			borderRadius='medium'
			borderWidth='default'
			color='secondary-info'
			display='flex'
			flexGrow={1}
			flexShrink={1}
			fontScale='p2'
			gap='x8'
			height='x40'
			minWidth='x144'
			paddingInlineEnd='x8'
			paddingInlineStart='x12'
			rcx-input-box
			{...props}
		>
			<Box is='span' flexGrow={1} textAlign='start'>
				{hasSelection ? t('Categories') : t('All_categories')}
			</Box>
			{hasSelection && <Badge variant='primary'>{selectedCategoriesCount}</Badge>}
			<Icon name='chevron-down' size='x20' />
		</Box>
	);
});

export default CategoryDropDownAnchor;
