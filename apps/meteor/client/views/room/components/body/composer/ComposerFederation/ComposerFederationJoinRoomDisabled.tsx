import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const ComposerFederationJoinRoomDisabled = (): ReactElement => {
	const t = useTranslation();

	return <MessageFooterCallout>{t('Federation_Matrix_join_public_rooms_is_enterprise')}</MessageFooterCallout>;
};

export default ComposerFederationJoinRoomDisabled;
