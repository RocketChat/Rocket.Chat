import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const ComposerBlocked = (): ReactElement => {
	const t = useTranslation();
	return <MessageFooterCallout>{t('room_is_blocked')}</MessageFooterCallout>;
};
