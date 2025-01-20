import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const ComposerFederationJoinRoomDisabled = (): ReactElement => {
	const { t } = useTranslation();

	return <MessageFooterCallout>{t('Federation_Matrix_join_public_rooms_is_premium')}</MessageFooterCallout>;
};

export default ComposerFederationJoinRoomDisabled;
