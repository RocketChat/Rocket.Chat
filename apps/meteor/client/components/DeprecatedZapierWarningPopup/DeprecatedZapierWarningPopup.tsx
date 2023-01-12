// import type { UiKitBannerPayload as BannerProps } from '@rocket.chat/core-typings';
import { Banner, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const DeprecatedZapierWarningPopup = (): ReactElement => {
	const t = useTranslation();

	return (
		<Banner icon={<Icon name='warning' />} title={t('This_is_a_deprecated_feature_alert')} variant='warning'>
			{t('Install_Zapier_from_marketplace')}
		</Banner>
	);
};

export default DeprecatedZapierWarningPopup;
