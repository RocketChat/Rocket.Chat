import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, Button } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import UpdateRocketChatButton from '../components/UpdateRocketChatButton';

const UnsupportedEmptyState = (): ReactElement => {
	const isAdmin = usePermission('manage-apps');
	const { t } = useTranslation();

	const title = isAdmin ? t('Update_to_access_marketplace') : t('Marketplace_unavailable');
	const description = isAdmin ? t('Update_to_access_marketplace_description') : t('Marketplace_unavailable_description');

	return (
		<Box mbs={64}>
			<States>
				<StatesIcon name='warning' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{description}</StatesSubtitle>
				<StatesActions>
					<Button secondary is='a' href='https://go.rocket.chat/i/support-prerequisites ' external>
						{t('Learn_more')}
					</Button>
					{isAdmin && <UpdateRocketChatButton />}
				</StatesActions>
			</States>
		</Box>
	);
};

export default UnsupportedEmptyState;
