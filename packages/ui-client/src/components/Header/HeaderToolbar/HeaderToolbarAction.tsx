import { IconButton } from '@rocket.chat/fuselage';
import { ComponentProps, forwardRef } from 'react';

type HeaderToolbarActionProps = ComponentProps<typeof IconButton> & {
	index?: number;
	id: string;
	action?: (id: string) => void;
	tooltip?: string;
};

const HeaderToolbarAction = forwardRef<HTMLButtonElement, HeaderToolbarActionProps>(function HeaderToolbarAction(
	{ id, icon, action, index, title, tooltip, ...props },
	ref,
) {
	const handleClick = () => {
		if (!action || !id) {
			return;
		}

		action(id);
	};

	return (
		<IconButton
			ref={ref}
			onClick={handleClick}
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
