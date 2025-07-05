import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Info from './ActivityItemInfo';
import { useTimeFromNow } from '../../../../../../hooks/useTimeFromNow';

type ActivityStatus = 'sent' | 'delivered' | 'read' | 'failed';

type ActivityListItemProps = {
	id: string;
	name: string;
	status: { id: ActivityStatus; ts: string };
	onClick: () => void;
};

const MessageStatus: Record<ActivityStatus, { icon: Keys; i18nLabel: TranslationKey }> = {
	sent: { icon: 'send', i18nLabel: 'Sent' },
	delivered: { icon: 'check-single', i18nLabel: 'Delivered' },
	read: { icon: 'check-double', i18nLabel: 'Read' },
	failed: { icon: 'warning', i18nLabel: 'Failed' },
};

const itemClass = css`
	&:hover,
	&:focus {
		background: ${Palette.surface['surface-hover']};
	}
`;

const ActivityListItem = ({ name, status, onClick }: ActivityListItemProps) => {
	const { t } = useTranslation();
	const getTimeFromNow = useTimeFromNow(true);

	const [statusIcon, statusLabel] = useMemo(() => {
		if (!status?.id || !MessageStatus[status.id]) {
			return ['warning', t('Unknown_status')] as const;
		}

		const { icon, i18nLabel } = MessageStatus[status.id];

		return [icon, t(i18nLabel)];
	}, [status, t]);

	return (
		<Box pi={24} pb={12} role='listitem' className={['rcx-box--animated', itemClass]} onClick={onClick}>
			<Box withTruncatedText display='flex'>
				<UserAvatar size='x20' title={name} username={name} />
				<Box is='p' withTruncatedText fontScale='p2b' mis={4}>
					{name}
				</Box>
			</Box>

			<Box mis={24}>
				<Info icon='doc' label='Template' value='Activity Template' />
				<Info icon={statusIcon} label={statusLabel} value={getTimeFromNow(status.ts)} />
			</Box>
		</Box>
	);
};

export default ActivityListItem;
