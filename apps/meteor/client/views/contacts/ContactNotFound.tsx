import {
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarEmptyContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export type ContactNotFoundProps = {
	onClose: () => void;
};

const ContactNotFound = ({ onClose }: ContactNotFoundProps) => {
	const { t } = useTranslation();

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='address-book' />
				<ContextualbarTitle>{t('Contact_info')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarEmptyContent icon='address-book' title={t('Contact_not_found')} />
		</ContextualbarDialog>
	);
};

export default ContactNotFound;
