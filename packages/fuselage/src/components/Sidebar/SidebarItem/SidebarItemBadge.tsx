import { Badge, type BadgeProps } from '../../Badge/index.js';

export const SidebarItemBadge = ({ className, ...props }: BadgeProps) => (
	<Badge className={['rcx-box rcx-box--full rcx-sidebar-item__badge', className].filter(Boolean).join(' ')} {...props} />
);
