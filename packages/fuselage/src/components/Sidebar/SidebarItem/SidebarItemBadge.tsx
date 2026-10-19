import { Badge, type BadgeProps } from '../../Badge';

export const SidebarItemBadge = ({ className, ...props }: BadgeProps) => (
	<Badge className={['rcx-sidebar-item__badge', className].filter(Boolean).join(' ')} {...props} />
);
