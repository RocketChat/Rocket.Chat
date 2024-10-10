import { Button } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

const UpdateRocketChatBtn = () => {
	const { t } = useTranslation();

	return (
		<Button primary is='a' href='https://docs.rocket.chat/v1/docs/en/updating-rocketchat' external>
			{t('Update_RocketChat')}
		</Button>
	);
};

export default UpdateRocketChatBtn;
