import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEventHandler } from 'react';
import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

type RoomDropDownAnchorProps = {
	selectedCategoriesCount: number;
	onClick?: MouseEventHandler<HTMLElement>;
} & ComponentProps<typeof Button>;

const RoomDropDownAnchor = forwardRef<HTMLElement, RoomDropDownAnchorProps>(function RoomDropDownAnchor(
	{ onClick, selectedCategoriesCount, ...props },
	ref,
) {
	const t = useTranslation();

	return (
		<Button
			ref={ref}
			onClick={onClick}
			display='flex'
			alignItems='center'
			flexDirection='row'
			flexGrow='1'
			flexShrink='1'
			borderColor={selectedCategoriesCount ? 'none' : 'light'}
			borderWidth={selectedCategoriesCount ? 'none' : 'x1'}
			{...(selectedCategoriesCount ? { primary: true } : { bg: 'surface-light' })}
			{...props}
		>
			{selectedCategoriesCount > 0 && (
				<Box
					mie='x6'
					borderRadius='x32'
					bg='light'
					fontWeight={700}
					fontSize='micro'
					color='info'
					pi='x6'
					display='flex'
					alignItems='center'
					justifyContent='center'
				>
					{selectedCategoriesCount}
				</Box>
			)}
			<Box is='span' display='flex' flexGrow={1} fontWeight={400} fontSize='p2b' color={selectedCategoriesCount ? 'white' : 'hint'}>
				{/* TODO: change this to the filters texts */}
				{selectedCategoriesCount > 0 ? t('Categories') : t('All_categories')}
			</Box>
			<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
				<Icon name='chevron-down' fontSize='x20' color={selectedCategoriesCount ? 'white' : 'hint'} />
			</Box>
		</Button>
	);
});

export default RoomDropDownAnchor;
