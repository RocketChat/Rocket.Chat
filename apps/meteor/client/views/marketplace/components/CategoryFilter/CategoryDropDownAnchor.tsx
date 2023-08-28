import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEventHandler } from 'react';
import React, { forwardRef } from 'react';

type CategoryDropDownAnchorProps = { selectedCategoriesCount: number; onClick?: MouseEventHandler<HTMLElement> } & ComponentProps<
	typeof Button
>;

const CategoryDropDownAnchor = forwardRef<HTMLElement, CategoryDropDownAnchorProps>(function CategoryDropDownAnchor(
	{ onClick, selectedCategoriesCount, ...props },
	ref,
) {
	const t = useTranslation();

	return (
		<Box
			is={Button}
			ref={ref}
			onClick={onClick}
			display='flex'
			alignItems='center'
			justifyContent='space-between'
			minWidth='x144'
			flexGrow={1}
			flexShrink={1}
			borderColor={selectedCategoriesCount ? 'none' : 'light'}
			borderWidth={selectedCategoriesCount ? 'none' : 'x1'}
			{...(selectedCategoriesCount ? { primary: true } : { bg: 'surface-light' })}
			{...props}
		>
			{selectedCategoriesCount > 0 && (
				<Box
					mie={6}
					borderRadius='x32'
					bg='light'
					fontWeight={700}
					fontSize='micro'
					color='info'
					pi={6}
					h='x40'
					display='flex'
					alignItems='center'
					justifyContent='center'
				>
					{selectedCategoriesCount}
				</Box>
			)}
			<Box is='span' display='flex' flexGrow={1} fontScale='p2' color={selectedCategoriesCount ? 'white' : 'hint'}>
				{selectedCategoriesCount > 0 ? t('Categories') : t('All_categories')}
			</Box>
			<Box mi={4} display='flex' alignItems='center' justifyContent='center'>
				<Icon name='chevron-down' size='x20' color={selectedCategoriesCount ? 'white' : 'hint'} />
			</Box>
		</Box>
	);
});

export default CategoryDropDownAnchor;
