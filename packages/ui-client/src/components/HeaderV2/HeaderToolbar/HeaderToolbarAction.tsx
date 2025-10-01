import { IconButton } from '@rocket.chat/fuselage';
import { ComponentProps, forwardRef } from 'react';

type HeaderToolbarActionProps = ComponentProps<typeof IconButton> & {
	id?: string;
	index?: number;
	tooltip?: string;
};

const HeaderToolbarAction = forwardRef<HTMLButtonElement, HeaderToolbarActionProps>(function HeaderToolbarAction(
	{ id, icon, index, title, tooltip, ...props },
	ref,
) {
	return (
		<IconButton
			ref={ref}
			data-toolbox={index}
			key={id}
			icon={icon}
			small
			position='relative'
			overflow='visible'
			title={tooltip ?? title}
			{...props}
		/>
	);
});

export default HeaderToolbarAction;
