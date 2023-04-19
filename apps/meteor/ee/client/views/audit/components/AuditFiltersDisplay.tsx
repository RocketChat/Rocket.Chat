import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useFormatDate } from '../../../../../client/hooks/useFormatDate';

type AuditFiltersDisplayProps = {
	users?: IUser['username'][];
	room?: IRoom['name'];
	startDate: Date;
	endDate: Date;
};

const AuditFiltersDisplay = ({ users, room, startDate, endDate }: AuditFiltersDisplayProps): ReactElement => {
	const formatDate = useFormatDate();
	const t = useTranslation();

	return (
		<Box display='flex' flexDirection='column' alignItems='stretch' withTruncatedText>
			<Box withTruncatedText>{users?.length ? users.map((user) => `@${user}`).join(' : ') : `#${room}`}</Box>
			<Box withTruncatedText>
				{formatDate(startDate)} {t('Date_to')} {formatDate(endDate)} {/* TODO: fix this translation */}
			</Box>
		</Box>
	);
};

export default AuditFiltersDisplay;
