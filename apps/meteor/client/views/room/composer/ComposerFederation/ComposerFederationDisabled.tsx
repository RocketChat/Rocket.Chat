import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const ComposerFederationDisabled = (): ReactElement => {
	const { t } = useTranslation();

	return <MessageFooterCallout>{t('Federation_Matrix_Federated_Description_disabled')}</MessageFooterCallout>;
};

export default ComposerFederationDisabled;
