import { Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { DateFormat } from '../../../../app/lib/client';
import { IMessage } from '../../../../definition/IMessage';
import { useTranslation } from '../../../contexts/TranslationContext';

type EditedType = FC<{
	msg: IMessage;
	size?: string;
}>;

const Edited: EditedType = ({ msg, ...props }) => {
	const t = useTranslation();

	const { editedBy, u, editedAt } = msg;
	const editedTime = editedAt ? DateFormat.formatDateAndTime(editedAt) : '';

	return (
		<Icon
			name='pencil'
			title={t('edited_message_time', { editedTime, username: editedBy && editedBy.username })}
			data-title={t('Edited')}
			color={editedBy && editedBy.username !== u.username ? 'danger' : ''}
			{...props}
		/>
	);
};

export default memo(Edited);
