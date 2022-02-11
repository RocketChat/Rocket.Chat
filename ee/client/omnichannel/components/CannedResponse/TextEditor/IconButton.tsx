import { Button, Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC, memo } from 'react';

type IconButtonProps = {
	name: ComponentProps<typeof Icon>['name'];
	action: () => void;
	title?: string;
};

const IconButton: FC<IconButtonProps> = ({ name, action, title }) => (
	<Button
		nude
		small
		square
		display='flex'
		justifyContent='center'
		alignItems='center'
		overflow='hidden'
		mie='12px'
		title={title}
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
