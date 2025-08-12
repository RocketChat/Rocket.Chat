import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useTranslation, useUser, useRoute } from '@rocket.chat/ui-contexts';

import { Page, PageHeader, PageContent } from '../../components/Page';

const ConferencePageError = () => {
	const t = useTranslation();
	const user = useUser();
	const route = useRoute('login');

	return (
		<Page background='tint'>
			<PageHeader title={t('Video_Conference')} />
			<PageContent>
				<States>
					<StatesIcon name='circle-exclamation' variation='danger' />
					<StatesTitle>{t('Call_not_found')}</StatesTitle>
					<StatesSubtitle>{t('Call_not_found_error')}</StatesSubtitle>
					{!user && (
						<StatesActions>
							<StatesAction onClick={() => route.push()}>{t('Back_to_login')}</StatesAction>
						</StatesActions>
					)}
				</States>
			</PageContent>
		</Page>
	);
};

export default ConferencePageError;
