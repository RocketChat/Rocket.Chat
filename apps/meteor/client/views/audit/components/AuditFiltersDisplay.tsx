import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../hooks/useFormatDate';

export type AuditFiltersDisplayProps = {
	users?: IUser['username'][];
	room?: IRoom['name'];
	startDate?: Date;
	endDate?: Date;
	filters?: string;
};

const AuditFiltersDisplay = ({ users, room, startDate, endDate, filters }: AuditFiltersDisplayProps) => {
	const formatDate = useFormatDate();
	const { t } = useTranslation();

	return (
		<Box display='flex' flexDirection='column' alignItems='stretch' withTruncatedText>
			<Text truncate>{users?.length ? users.map((user) => `@${user}`).join(' : ') : `#${room}`}</Text>
			{startDate && endDate ? (
				<Text truncate>
					{formatDate(startDate)} {t('Date_to')} {formatDate(endDate)} {/* TODO: fix this translation */}
				</Text>
			) : null}
			{filters ? <Text truncate>{filters}</Text> : null}
		</Box>
	);
};

export default AuditFiltersDisplay;
