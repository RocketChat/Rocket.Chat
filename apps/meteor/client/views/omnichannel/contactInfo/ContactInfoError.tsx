import { useTranslation } from 'react-i18next';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarDialog,
} from '../../../components/Contextualbar';

const ContactInfoError = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='user' />
				<ContextualbarTitle>{t('Contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarEmptyContent icon='user' title={t('Contact_not_found')} />
		</ContextualbarDialog>
	);
};

export default ContactInfoError;
