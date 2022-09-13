import { MessageComposerDisabled } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const ComposerBlocked = (): ReactElement => {
	const t = useTranslation();
	return <MessageComposerDisabled>{t('room_is_blocked')}</MessageComposerDisabled>;
};
