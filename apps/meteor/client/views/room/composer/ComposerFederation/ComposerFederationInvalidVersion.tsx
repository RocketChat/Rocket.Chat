import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const ComposerFederationInvalidVersion = (): ReactElement => {
	const { t } = useTranslation();

	return <MessageFooterCallout>{t('Federation_Matrix_Federated_Description_invalid_version')}</MessageFooterCallout>;
};

export default ComposerFederationInvalidVersion;
