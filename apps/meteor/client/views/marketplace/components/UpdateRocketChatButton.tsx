import { Button } from '@rocket.chat/fuselage';
import { links } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

const UpdateRocketChatButton = () => {
	const { t } = useTranslation();

	return (
		<Button icon='new-window' primary is='a' href={links.updatingRocketChat} external>
			{t('Update')}
		</Button>
	);
};

export default UpdateRocketChatButton;
