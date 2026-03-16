import { SidebarV2ItemBadge } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type UnreadBadgeProps = {
	title: string;
	roomTitle?: string;
	variant: 'primary' | 'warning' | 'danger' | 'secondary';
	total: number;
};

const UnreadBadge = ({ title, variant, total, roomTitle }: UnreadBadgeProps) => {
	const { t } = useTranslation();

	return (
		<SidebarV2ItemBadge
			variant={variant}
			title={title}
			role='status'
			aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle: title, roomTitle })}
		>
			<span aria-hidden>{total}</span>
		</SidebarV2ItemBadge>
	);
};

export default UnreadBadge;
