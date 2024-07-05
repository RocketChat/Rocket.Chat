import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ComponentPropsWithoutRef, MouseEventHandler } from 'react';

type HeaderStateProps =
	| (Omit<ComponentPropsWithoutRef<typeof IconButton>, 'onClick'> & {
			onClick: MouseEventHandler;
	  })
	| (Omit<ComponentPropsWithoutRef<typeof Icon>, 'name' | 'onClick'> & {
			icon: IconName;
			onClick?: undefined;
	  });

const HeaderState = (props: HeaderStateProps) =>
	props.onClick ? <IconButton mini {...props} /> : <Icon size='x16' name={props.icon} {...props} />;

export default HeaderState;
