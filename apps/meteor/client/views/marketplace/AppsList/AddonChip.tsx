import type { App } from '@rocket.chat/core-typings';
import { Tag } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { doesAppRequireAddon } from '../helpers/doesAppRequireAddon';

const AddonChip = ({ app }: { app: App }) => {
	const { t } = useTranslation();

	if (!doesAppRequireAddon(app)) {
		return null;
	}

	return (
		<Tag variant='secondary' title={t('Requires_subscription_add-on')}>
			{t('Add-on')}
		</Tag>
	);
};

export default AddonChip;
