import { SidebarItemBadge } from '@rocket.chat/fuselage';

export type UnreadBadgeProps = {
	title: string;
	/** What a reader is told the badge means, phrased by whoever knows the room's name. */
	label: string;
	variant: 'primary' | 'warning' | 'danger' | 'secondary';
	total: number;
};

const UnreadBadge = ({ title, label, variant, total }: UnreadBadgeProps) => (
	<SidebarItemBadge variant={variant} title={title} role='status' aria-label={label}>
		<span aria-hidden>{total}</span>
	</SidebarItemBadge>
);

export default UnreadBadge;
