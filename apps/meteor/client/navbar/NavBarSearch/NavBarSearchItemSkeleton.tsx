import { ItemSkeleton } from '@rocket.chat/fuselage';

// Placeholder row shown while the server spotlight results are still loading.
// Decorative only: it has no `role='option'`, so keyboard navigation skips it
// (see useSearchNavigation), and ItemSkeleton hides it from assistive technology.
// Loading is conveyed via aria-busy.
const NavBarSearchItemSkeleton = () => <ItemSkeleton inset='md' />;

export default NavBarSearchItemSkeleton;
