import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export type ContactInfoErrorProps = {
	onClose: () => void;
};

const ContactInfoError = ({ onClose }: ContactInfoErrorProps) => {
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
