import { MessageComposerDisabled } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const ComposerReadOnly = (): ReactElement => {
	const t = useTranslation();
	return <MessageComposerDisabled>{t('room_is_read_only')}</MessageComposerDisabled>;
};
