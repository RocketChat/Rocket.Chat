import { ContextualbarEmptyContent } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const ContactInfoHistory = () => {
	const t = useTranslation();
	const isEmpty = true;

	if (!isEmpty) {
		return null;
	}

	return <ContextualbarEmptyContent icon='history' title={t('No_history_yet')} subtitle={t('No_history_yet_description')} />;
};

export default ContactInfoHistory;
