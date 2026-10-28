import { Badge } from '@rocket.chat/fuselage';
import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

export type UnreadBadgeProps = {
	title: string;
	roomTitle?: string;
	variant: 'primary' | 'warning' | 'danger' | 'secondary';
	total: number;
	href?: string;
	onClick?: MouseEventHandler<HTMLElement>;
};

const UnreadBadge = ({ title, variant, total, roomTitle, href, onClick }: UnreadBadgeProps) => {
	const { t } = useTranslation();
	const linkProps = href ? { is: 'a' as const, href, onClick, tabIndex: -1 } : undefined;

	return (
		<Badge {...linkProps} variant={variant} title={title}>
			<span role='status' aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle: title, roomTitle })}>
				<span aria-hidden>{total}</span>
			</span>
		</Badge>
	);
};

export default UnreadBadge;
