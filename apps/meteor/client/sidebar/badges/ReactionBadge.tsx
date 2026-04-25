import { SidebarV2ItemBadge, Icon } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

type ReactionBadgeProps = {
	title: string;
	roomTitle?: string;
	total: number;
};

const ReactionBadge = ({ title, total, roomTitle }: ReactionBadgeProps) => {
	const { t } = useTranslation();

	return (
		<SidebarV2ItemBadge
			variant='primary'
			title={title}
			role='status'
			aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle: title, roomTitle })}
		>
			<Icon name='emoji' size='x12' />
			<span aria-hidden style={{ marginLeft: '2px' }}>{total}</span>
		</SidebarV2ItemBadge>
	);
};

export default ReactionBadge;
