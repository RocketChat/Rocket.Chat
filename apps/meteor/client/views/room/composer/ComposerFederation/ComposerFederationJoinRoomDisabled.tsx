import { MessageFooterCallout } from '@rocket.chat/ui-composer';
import { useTranslation } from 'react-i18next';

const ComposerFederationJoinRoomDisabled = () => {
	const { t } = useTranslation();

	return <MessageFooterCallout>{t('Federation_Matrix_join_public_rooms_is_premium')}</MessageFooterCallout>;
};

export default ComposerFederationJoinRoomDisabled;
