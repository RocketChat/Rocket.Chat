import { Box, Button, Icon, Select } from '@rocket.chat/fuselage';
import React, { ComponentProps, forwardRef } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

const CategoryDropDownAnchor = forwardRef<HTMLElement, Partial<ComponentProps<typeof Select>> & { selectedCategoriesCount: number }>(
	function CategoryDropDownAnchor(props, ref) {
		const t = useTranslation();

		return (
			<Button primary ref={ref} onClick={props.onClick} display='flex' alignItems='center' flexDirection='row' flexGrow='1' flexShrink='1'>
				{props.selectedCategoriesCount > 0 && (
					<Box
						mie='x6'
						borderRadius='50%'
						bg='alternative'
						fontWeight={700}
						fontSize='micro'
						color='primary'
						width='x16'
						height='x16'
						display='flex'
						alignItems='center'
						justifyContent='center'
					>
						{props.selectedCategoriesCount}
					</Box>
				)}
				<Box is='span' fontWeight='500' fontSize='p2b' color='alternative' mi='x4'>
					{props.selectedCategoriesCount > 0 ? t('Categories') : t('All_categories')}
				</Box>
				<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
					<Icon name='chevron-down' fontSize='x20' />
				</Box>
			</Button>
		);
	},
);

export default CategoryDropDownAnchor;
