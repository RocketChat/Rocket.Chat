import { IconButton as Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, memo, ReactElement } from 'react';

type IconButtonProps = {
	name: ComponentProps<typeof Icon>['icon'];
	action: () => void;
	title?: string;
};

const IconButton = ({ name, action, title }: IconButtonProps): ReactElement => (
	<Icon
		icon={name}
		size='24px'
		color='neutral-700'
		small
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
	/>
);
export default memo(IconButton);
