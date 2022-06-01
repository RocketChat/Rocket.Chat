import { Box, Button, Icon, Select } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, forwardRef } from 'react';

const CategoryDropDownAnchor = forwardRef<HTMLInputElement, Partial<ComponentProps<typeof Select>> & { selectedCategoriesCount: number }>(
	function CategoryDropDownAnchor(props, ref) {
		const t = useTranslation();

		return (
			<Button
				ref={ref}
				onClick={props.onClick}
				display='flex'
				alignItems='center'
				flexDirection='row'
				flexGrow='1'
				flexShrink='1'
				borderColor={props.selectedCategoriesCount ? 'none' : 'neutral-500'}
				borderWidth={props.selectedCategoriesCount ? 'none' : 'x2'}
				bg={props.selectedCategoriesCount ? 'primary' : 'alternative'}
			>
				{props.selectedCategoriesCount > 0 && (
					<Box
						mie='x6'
						borderRadius='x32'
						bg='alternative'
						fontWeight={700}
						fontSize='micro'
						color='primary'
						pi='x6'
						display='flex'
						alignItems='center'
						justifyContent='center'
					>
						{props.selectedCategoriesCount}
					</Box>
				)}
				<Box is='span' fontWeight='500' fontSize='p2b' color={props.selectedCategoriesCount ? 'alternative' : 'hint'} mi='x4'>
					{props.selectedCategoriesCount > 0 ? t('Categories') : t('All_categories')}
				</Box>
				<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
					<Icon name='chevron-down' fontSize='x20' color={props.selectedCategoriesCount ? 'alternative' : 'hint'} />
				</Box>
			</Button>
		);
	},
);

export default CategoryDropDownAnchor;
