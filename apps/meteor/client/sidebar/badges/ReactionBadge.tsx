import { SidebarV2ItemBadge, Icon, Box } from '@rocket.chat/fuselage';
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
			aria-hidden={true}
		>
			<Icon name='emoji' size='x12' />
			<Box is='span' aria-hidden mis={2}>{total}</Box>
		</SidebarV2ItemBadge>
	);
};

export default ReactionBadge;
