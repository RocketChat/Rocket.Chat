import { ItemMeta, SidebarItem, SidebarItemIcon, SidebarItemTitle, Tag } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type SidebarNavigationItemProps = {
	permissionGranted?: (() => boolean) | boolean;
	pathSection: string;
	icon?: IconName;
	label?: string;
	tag?: string;
	currentPath?: string;
	externalUrl?: boolean;
	badge?: () => ReactNode;
};

const SidebarNavigationItem = ({
	permissionGranted,
	pathSection,
	icon,
	label,
	currentPath,
	tag,
	externalUrl,
	badge: Badge,
}: SidebarNavigationItemProps) => {
	const path = pathSection;
	const isActive = !!path && currentPath?.includes(path);

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	return (
		<SidebarItem
			selected={isActive}
			level={2}
			href={path}
			aria-current={isActive ? 'page' : undefined}
			{...(externalUrl && { target: '_blank', rel: 'noopener noreferrer' })}
		>
			{icon && <SidebarItemIcon icon={icon} />}
			<SidebarItemTitle>{label}</SidebarItemTitle>
			{tag && (
				<ItemMeta>
					<Tag>{tag}</Tag>
				</ItemMeta>
			)}
			{Badge ? <Badge /> : null}
		</SidebarItem>
	);
};

export default memo(SidebarNavigationItem);
