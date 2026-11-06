import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../hooks/useFormatDate';

export type HistoryRestrictedBadgeProps = Omit<ComponentProps<typeof Icon>, 'name' | 'color' | 'role'> & {
	historyVisibleFrom: string | Date;
};

const HistoryRestrictedBadge = ({ historyVisibleFrom, ...props }: HistoryRestrictedBadgeProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<Icon
			size='x20'
			{...props}
			role='status'
			color='hint'
			name='eye-off'
			aria-hidden='false'
			title={t('Messages_hidden_before_date', { date: formatDate(historyVisibleFrom) })}
		/>
	);
};

export default HistoryRestrictedBadge;
