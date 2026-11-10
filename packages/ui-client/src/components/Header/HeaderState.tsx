import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ComponentPropsWithoutRef, MouseEventHandler } from 'react';

export type HeaderStateProps =
	| (Pick<ComponentPropsWithoutRef<typeof IconButton>, 'color' | 'title' | 'icon'> & {
			onClick: MouseEventHandler;
	  } & Omit<ComponentPropsWithoutRef<typeof IconButton>, 'color' | 'title' | 'icon' | 'onClick' | 'is' | 'size'>)
	| (Omit<ComponentPropsWithoutRef<typeof Icon>, 'name' | 'onClick'> & {
			icon: IconName;
			onClick?: undefined;
	  });

const HeaderState = (props: HeaderStateProps) =>
	props.onClick ? <IconButton size='tiny' {...props} /> : <Icon size='x16' name={props.icon} {...props} />;

export default HeaderState;
