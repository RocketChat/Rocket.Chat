import { SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemTitle, Skeleton } from '@rocket.chat/fuselage';

// Placeholder row shown while the server spotlight results are still loading.
// Decorative only: it has no `role='option'` so keyboard navigation skips it
// (see useSearchNavigation), and `tabIndex={-1}` + `pointerEvents='none'` keep
// it out of reach of focus and mouse clicks. Loading is conveyed via aria-busy.
const NavBarSearchItemSkeleton = () => {
	return (
		<SidebarV2Item aria-hidden tabIndex={-1} style={{ pointerEvents: 'none' }}>
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
