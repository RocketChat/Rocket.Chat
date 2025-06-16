import { Sidebar, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo, useState } from 'react';

type MediumProps = {
	title: ReactNode;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	icon?: string;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	menu?: () => ReactNode;
	badges?: ReactNode;
	selected?: boolean;
	menuOptions?: any;
};

const Medium = ({ icon, title = '', avatar, actions, href, badges, unread, menu, ...props }: MediumProps) => {
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	return (
		<Sidebar.Item {...props} href={href} clickable={!!href} onFocus={handleFocus} onPointerEnter={handlePointerEnter}>
			{avatar && <Sidebar.Item.Avatar>{avatar}</Sidebar.Item.Avatar>}
			<Sidebar.Item.Content>
				<Sidebar.Item.Wrapper>
					{icon}
					<Sidebar.Item.Title data-qa='sidebar-item-title' className={unread ? 'rcx-sidebar-item--highlighted' : undefined}>
						{title}
					</Sidebar.Item.Title>
				</Sidebar.Item.Wrapper>
				{badges && <Sidebar.Item.Badge>{badges}</Sidebar.Item.Badge>}
				{menu && (
					<Sidebar.Item.Menu>
						{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-item__menu icon='kebab' />}
					</Sidebar.Item.Menu>
				)}
			</Sidebar.Item.Content>
			{actions && (
				<Sidebar.Item.Container>
					<Sidebar.Item.Actions>{actions}</Sidebar.Item.Actions>
				</Sidebar.Item.Container>
			)}
		</Sidebar.Item>
	);
};

export default memo(Medium);
