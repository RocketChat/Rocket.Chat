import { Box } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { Trans } from 'react-i18next';

const NewBot = () => (
	<Box pb={20} fontScale='h4' key='bots'>
		<Trans
			i18nKey='additional_integrations_Bots'
			components={{ a: <ExternalLink to='https://github.com/RocketChat/hubot-rocketchat' /> }}
		/>
	</Box>
);

export default NewBot;
