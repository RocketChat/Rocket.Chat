import React, { FC, memo } from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';

import { DateFormat } from '../../../../app/lib/client';
import { IMessage } from '../../../../definition/IMessage';
import { useTranslation } from '../../../contexts/TranslationContext';

const StatusIcon: FC<{icon: string; msg: IMessage}> = ({ icon, msg }): any => {
	const t = useTranslation();

	const { editedBy, u, editedAt } = msg;
	const editedTime = editedAt ? DateFormat.formatDateAndTime(editedAt) : '';
	return <Box is='span' mis='x3' title={`${ t('edited') } ${ t('at') } ${ editedTime }  ${ t('by') } ${ editedBy && editedBy.username }`}>
		<Icon name={icon} data-title={t('Edited')} color={editedBy && editedBy.username !== u.username ? 'danger' : ''}/>
	</Box>;
};

export default memo(StatusIcon);
