import { SidebarV2ItemBadge } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type DraftBadgeProps = {
	roomTitle?: string;
};

const DraftBadge = ({ roomTitle }: DraftBadgeProps) => {
	const { t } = useTranslation();

	return (
		<SidebarV2ItemBadge
			variant='warning'
			title={t('Draft_message')}
			role='status'
			aria-label={t('__draftMessage__from__roomTitle__', { roomTitle })}
		>
			{t('Draft')}
		</SidebarV2ItemBadge>
	);
};

export default DraftBadge;
