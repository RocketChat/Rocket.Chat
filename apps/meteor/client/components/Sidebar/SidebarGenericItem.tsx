import { Box, SidebarItem } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { memo } from 'react';

type SidebarGenericItemProps = {
	href?: string;
	active?: boolean;
	featured?: boolean;
	children: ReactNode;
	onClick?: () => void;
	externalUrl?: boolean;
};

const SidebarGenericItem = ({ href, active, externalUrl, onClick , children, ...props }: SidebarGenericItemProps): ReactElement => {
	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
            onClick();
        }
    };
	return(
	<SidebarItem
		selected={active}
		clickable
		is='a'
		href={href}
		onClick={(e) => {onClick?.();}}
		{...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })}
		{...props}
	>
		<Box display='flex' flexDirection='row' alignItems='center' pb={8} width='100%'>
			{children}
		</Box>
	</SidebarItem>
	);
};

export default memo(SidebarGenericItem);
