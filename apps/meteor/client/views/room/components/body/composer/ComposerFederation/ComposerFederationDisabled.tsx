import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const ComposerFederationDisabled = (): ReactElement => {
	const t = useTranslation();

	return <MessageFooterCallout>{t('Federation_Matrix_Federated_Description_disabled')}</MessageFooterCallout>;
};

export default ComposerFederationDisabled;
