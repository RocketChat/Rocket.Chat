import { IconButton } from '@rocket.chat/fuselage';
import { ComponentProps, forwardRef } from 'react';

type HeaderToolbarActionProps = ComponentProps<typeof IconButton> & {
	id?: string;
	tooltip?: string;
};

const HeaderToolbarAction = forwardRef<HTMLButtonElement, HeaderToolbarActionProps>(function HeaderToolbarAction(
	{ id, icon, title, tooltip, ...props },
	ref,
) {
	return <IconButton ref={ref} key={id} icon={icon} small position='relative' overflow='visible' title={tooltip ?? title} {...props} />;
});

export default HeaderToolbarAction;
