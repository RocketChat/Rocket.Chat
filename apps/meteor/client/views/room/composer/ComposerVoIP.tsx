import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const ComposerVoIP = (): ReactElement => {
	const { t } = useTranslation();
	return <MessageFooterCallout>{t('Composer_not_available_phone_calls')}</MessageFooterCallout>;
};

export default ComposerVoIP;
