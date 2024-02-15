import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const ComposerReadOnly = (): ReactElement => {
	const t = useTranslation();

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t('Room_archived')}</MessageFooterCalloutContent>
		</MessageFooterCallout>
	);
};

export default ComposerReadOnly;
