import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, RefAttributes } from 'react';

export type HeaderToolbarActionProps = ComponentPropsWithoutRef<typeof IconButton> & {
	tooltip?: string;
} & RefAttributes<HTMLButtonElement>;

const HeaderToolbarAction = ({ icon, title, tooltip, ref, ...props }: HeaderToolbarActionProps) => (
	<IconButton ref={ref} icon={icon} small position='relative' overflow='visible' title={tooltip ?? title} {...props} />
);

export default HeaderToolbarAction;
