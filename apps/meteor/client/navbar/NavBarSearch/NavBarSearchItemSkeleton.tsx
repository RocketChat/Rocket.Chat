import { SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemTitle, Skeleton } from '@rocket.chat/fuselage';

const NavBarSearchItemSkeleton = () => {
	return (
		<SidebarV2Item aria-hidden tabIndex={-1}>
			<SidebarV2ItemAvatarWrapper>
				<Skeleton variant='rect' width={20} height={20} />
			</SidebarV2ItemAvatarWrapper>
			<SidebarV2ItemTitle>
				<Skeleton />
			</SidebarV2ItemTitle>
		</SidebarV2Item>
	);
};

export default NavBarSearchItemSkeleton;
