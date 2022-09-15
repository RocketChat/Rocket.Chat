import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const ComposerReadOnly = (): ReactElement => {
	const t = useTranslation();
	return <MessageFooterCallout>{t('room_is_read_only')}</MessageFooterCallout>;
};
