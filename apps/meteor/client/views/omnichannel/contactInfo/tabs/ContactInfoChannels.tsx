import { ContextualbarEmptyContent } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const ContactInfoChannels = () => {
	const t = useTranslation();
	const isEmpty = true;

	if (!isEmpty) {
		return null;
	}

	return <ContextualbarEmptyContent icon='balloon' title={t('No_channels_yet')} subtitle={t('No_channels_yet_description')} />;
};

export default ContactInfoChannels;
