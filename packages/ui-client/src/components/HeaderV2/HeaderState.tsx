import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { AllHTMLAttributes, ComponentPropsWithoutRef, MouseEventHandler } from 'react';

type HeaderStateProps =
	| (Pick<ComponentPropsWithoutRef<typeof IconButton>, 'color' | 'title' | 'icon'> & {
			onClick: MouseEventHandler;
	  } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>)
	| (Omit<ComponentPropsWithoutRef<typeof Icon>, 'name' | 'onClick'> & {
			icon: IconName;
			onClick?: undefined;
	  });

const HeaderState = (props: HeaderStateProps) =>
	props.onClick ? <IconButton tiny mie={4} {...props} /> : <Icon size='x16' mie={8} name={props.icon} {...props} />;

export default HeaderState;
