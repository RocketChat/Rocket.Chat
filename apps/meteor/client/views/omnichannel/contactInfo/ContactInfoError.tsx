import { useTranslation } from 'react-i18next';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
} from '../../../components/Contextualbar';

const ContactInfoError = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='user' />
				<ContextualbarTitle>{t('Contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarEmptyContent icon='user' title={t('Contact_not_found')} />
		</>
	);
};

export default ContactInfoError;
