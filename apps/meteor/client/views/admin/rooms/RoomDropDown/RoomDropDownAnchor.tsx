import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEventHandler } from 'react';
import React, { forwardRef } from 'react';

type RoomDropDownAnchorProps = {
	selectedCategoriesCount: number;
	textAllSelected: 'All_rooms' | 'All_visible';
	textSomeCategories: 'Rooms' | 'Visibility';
	onClick?: MouseEventHandler<HTMLElement>;
} & ComponentProps<typeof Button>;

const RoomDropDownAnchor = forwardRef<HTMLElement, RoomDropDownAnchorProps>(function RoomDropDownAnchor(
	{ onClick, selectedCategoriesCount, textAllSelected, textSomeCategories, ...props },
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
			bg='surface-light'
			{...props}
		>
			{selectedCategoriesCount > 0 ? (
				<Box
					mie='x6'
					borderRadius='x32'
					bg='light'
					fontWeight={700}
					fontSize='micro'
					color='default'
					pi='x6'
					display='flex'
					alignItems='center'
					justifyContent='center'
				>
					{/* 
						it should display something like 'Rooms (5)' or 'Visibility (2)' 
					*/}
					{t(textSomeCategories)} ({selectedCategoriesCount})
				</Box>
			) : (
				<Box
					mie='x6'
					borderRadius='x32'
					bg='light'
					fontWeight={700}
					fontSize='micro'
					color='default'
					pi='x6'
					display='flex'
					alignItems='center'
					justifyContent='center'
				>
					{/* 
						it should display something like 'All rooms' or 'All visible' 
					*/}
					{t(textAllSelected)}
				</Box>
			)}

			<Box mi='x4' display='flex' alignItems='center' justifyContent='center'>
				<Icon name='chevron-down' fontSize='x20' color='hint' />
			</Box>
		</Button>
	);
});

export default RoomDropDownAnchor;
