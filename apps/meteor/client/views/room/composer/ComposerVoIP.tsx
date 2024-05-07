import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const ComposerVoIP = (): ReactElement => {
	const t = useTranslation();
	return <MessageFooterCallout>{t('Composer_not_available_phone_calls')}</MessageFooterCallout>;
};

export default ComposerVoIP;
