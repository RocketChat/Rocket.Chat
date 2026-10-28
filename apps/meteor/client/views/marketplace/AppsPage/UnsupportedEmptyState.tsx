import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, Button } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { links } from '../../../lib/links';
import UpdateRocketChatButton from '../components/UpdateRocketChatButton';
import AppsPageEmptyState from './layout/AppsPageEmptyState';

const UnsupportedEmptyState = () => {
	const isAdmin = usePermission('manage-apps');
	const { t } = useTranslation();

	const title = isAdmin ? t('Update_to_access_marketplace') : t('Marketplace_unavailable');
	const description = isAdmin ? t('Update_to_access_marketplace_description') : t('Marketplace_unavailable_description');

	return (
		<AppsPageEmptyState offset='x64'>
			<States>
				<StatesIcon name='warning' />
				<StatesTitle>{title}</StatesTitle>
				<StatesSubtitle>{description}</StatesSubtitle>
				<StatesActions>
					<Button variant='secondary' is='a' href={links.go.supportPrerequisites} external>
						{t('Learn_more')}
					</Button>
					{isAdmin && <UpdateRocketChatButton />}
				</StatesActions>
			</States>
		</AppsPageEmptyState>
	);
};

export default UnsupportedEmptyState;
