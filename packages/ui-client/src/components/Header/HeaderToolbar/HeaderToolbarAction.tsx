import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

type HeaderToolbarActionProps = ComponentPropsWithoutRef<typeof IconButton> & {
	tooltip?: string;
};

const HeaderToolbarAction = forwardRef<HTMLButtonElement, HeaderToolbarActionProps>(function HeaderToolbarAction(
	{ icon, title, tooltip, ...props },
	ref,
) {
	return <IconButton ref={ref} icon={icon} small position='relative' overflow='visible' title={tooltip ?? title} {...props} />;
});

export default HeaderToolbarAction;
