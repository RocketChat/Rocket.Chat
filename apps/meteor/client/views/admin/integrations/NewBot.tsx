import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

const NewBot = () => {
	const { t } = useTranslation();

	return (
		<Box
			pb={20}
			fontScale='h4'
			key='bots'
			dangerouslySetInnerHTML={{
				__html: DOMPurify.sanitize(t('additional_integrations_Bots'), {
					ALLOWED_TAGS: ['a'],
					ALLOWED_ATTR: ['href', 'target'],
				}),
			}}
		/>
	);
};

export default NewBot;
