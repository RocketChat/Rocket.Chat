import type { Button } from '@rocket.chat/fuselage';
import { Box, Icon } from '@rocket.chat/fuselage';
import colorTokens from '@rocket.chat/fuselage-tokens/colors.json';
import type { ComponentProps, MouseEventHandler } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

type CategoryDropDownAnchorProps = { selectedCategoriesCount: number; onClick?: MouseEventHandler<HTMLElement> } & ComponentProps<
	typeof Button
>;

const CategoryDropDownAnchor = forwardRef<HTMLElement, CategoryDropDownAnchorProps>(function CategoryDropDownAnchor(
	{ onClick, selectedCategoriesCount, ...props },
	ref,
) {
	const { t } = useTranslation();

	return (
		<Box
			is='button'
			ref={ref}
			onClick={onClick}
			alignItems='center'
			bg={selectedCategoriesCount ? colorTokens.b500 : 'light'}
			borderColor={selectedCategoriesCount ? 'none' : 'light'}
			borderRadius='x4'
			borderWidth={selectedCategoriesCount ? 'none' : 'x1'}
			display='flex'
			flexGrow={1}
			flexShrink={1}
			justifyContent='space-between'
			minWidth='x144'
			height='x40'
			pie={7}
			pis={14}
			lineHeight='unset'
			rcx-input-box
			{...props}
		>
			{selectedCategoriesCount > 0 && (
				<Box
					is='span'
					alignItems='center'
					bg='light'
					borderRadius='x32'
					color='info'
					display='flex'
					fontSize='micro'
					fontWeight={700}
					h='fit-content'
					justifyContent='center'
					mie={6}
					minWidth={22}
					pb={4}
					pi={0}
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
