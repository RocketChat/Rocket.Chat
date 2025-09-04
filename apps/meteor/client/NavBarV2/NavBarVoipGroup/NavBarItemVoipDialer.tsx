import { css } from '@rocket.chat/css-in-js';
import { Button, IconButton, NavBarItem, Throbber } from '@rocket.chat/fuselage';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import type { HTMLAttributes } from 'react';

type NavBarItemVoipDialerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	primary?: boolean;
};

const NavBarItemVoipDialer = ({ className, ...props }: NavBarItemVoipDialerProps) => {
	const { action, title, icon, loading } = useMediaCallAction();

	// TODO: this should not be here. These styles do not exist in the design system.
	const innerClassName = css`
		background-color: transparent !important;
		border: none !important;
		.rcx-button--content {
			overflow: visible !important;
		}
	`;

	return (
		<NavBarItem {...props} title={title}>
			{loading ? (
				<Button
					small
					square
					// onClick={action}
					disabled
					title={title}
					// overflow='visible'
					className={[className, innerClassName]}
				>
					<Throbber size={6} />
				</Button>
			) : (
				<IconButton icon={icon} onClick={action} small />
			)}
		</NavBarItem>
	);
};

export default NavBarItemVoipDialer;
