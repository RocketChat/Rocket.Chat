import React, { FC, memo } from 'react';
import { Icon } from '@rocket.chat/fuselage';

import { DateFormat } from '../../../../app/lib/client';
import { IMessage } from '../../../../definition/IMessage';
import { useTranslation } from '../../../contexts/TranslationContext';

type EditedType = FC<{
	msg: IMessage;
}>;

const Edited: EditedType = ({ msg }) => {
	const t = useTranslation();

	const { editedBy, u, editedAt } = msg;
	const editedTime = editedAt ? DateFormat.formatDateAndTime(editedAt) : '';

	return <Icon name='pencil' title={`${ t('edited') } ${ t('at') } ${ editedTime }  ${ t('by') } ${ editedBy && editedBy.username }`} data-title={t('Edited')} color={editedBy && editedBy.username !== u.username ? 'danger' : ''}/>;
};

export default memo(Edited);
