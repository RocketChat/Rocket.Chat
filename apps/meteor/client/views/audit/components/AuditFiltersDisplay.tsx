import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../hooks/useFormatDate';

type AuditFiltersDisplayProps = {
	users?: IUser['username'][];
	room?: IRoom['name'];
	startDate?: Date;
	endDate?: Date;
	filters?: string;
};

const AuditFiltersDisplay = ({ users, room, startDate, endDate, filters }: AuditFiltersDisplayProps): ReactElement => {
	const formatDate = useFormatDate();
	const { t } = useTranslation();

	return (
		<Box display='flex' flexDirection='column' alignItems='stretch' withTruncatedText>
			<Box withTruncatedText>{users?.length ? users.map((user) => `@${user}`).join(' : ') : `#${room}`}</Box>
			{startDate && endDate ? (
				<Box withTruncatedText>
					{formatDate(startDate)} {t('Date_to')} {formatDate(endDate)} {/* TODO: fix this translation */}
				</Box>
			) : null}
			{filters ? <Box withTruncatedText>{filters}</Box> : null}
		</Box>
	);
};

export default AuditFiltersDisplay;
