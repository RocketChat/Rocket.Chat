import { Button, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

type IconButtonProps = {
	name: string;
	action: () => void;
};

const IconButton: FC<IconButtonProps> = ({ name, action }) => (
	<Button
		nude
		small
		square
		display='flex'
		justifyContent='center'
		alignItems='center'
		overflow='hidden'
		mie='12px'
		onClick={(e): void => {
			e.stopPropagation();
			e.preventDefault();
			action();
		}}
	>
		<Icon name={name} size='24px' color='neutral-700' />
	</Button>
);
export default memo(IconButton);
