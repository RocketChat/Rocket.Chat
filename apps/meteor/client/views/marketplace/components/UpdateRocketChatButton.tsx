import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { links } from '../../../lib/links';

const UpdateRocketChatButton = () => {
	const { t } = useTranslation();

	return (
		<Button icon='new-window' primary is='a' href={links.updatingRocketChat} external>
			{t('Update')}
		</Button>
	);
};

export default UpdateRocketChatButton;
