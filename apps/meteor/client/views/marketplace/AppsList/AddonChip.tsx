import { Tag } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AddonChip = () => {
	const { t } = useTranslation();

	// TODO: check app add-on necessity
	const condition = false;

	if (condition) {
		return null;
	}

	return (
		<Tag variant='secondary' title={t('Requires_subscription_add-on')}>
			{t('Add-on')}
		</Tag>
	);
};

export default AddonChip;
