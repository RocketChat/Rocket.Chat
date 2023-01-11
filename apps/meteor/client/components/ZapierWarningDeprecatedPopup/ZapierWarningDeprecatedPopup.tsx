import { Banner, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const ZapierDeprecatedWarningPopup = () => {
	const t = useTranslation();

	return <Banner icon={<Icon name='warning' />} title={t('This_is_a_deprecated_feature_alert')} variant='warning' />;
};

export default ZapierDeprecatedWarningPopup;
