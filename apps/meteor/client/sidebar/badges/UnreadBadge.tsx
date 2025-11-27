import { Badge } from '@rocket.chat/fuselage';
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
		<Badge
			role='status'
			{...({ style: { display: 'inline-flex', flexShrink: 0 } } as any)}
			variant={variant}
			title={title}
			aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle: title, roomTitle })}
		>
			<span aria-hidden>{total}</span>
		</Badge>
	);
};

export default UnreadBadge;
