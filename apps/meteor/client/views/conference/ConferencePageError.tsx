import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation, useUser, useRoute } from '@rocket.chat/ui-contexts';

const ConferencePageError = () => {
	const t = useTranslation();
	const user = useUser();
	const route = useRoute('login');

	return (
		<Page background='tint'>
			<PageHeader title={t('Video_Conference')} />
			<PageContent display='flex' alignItems='center' justifyContent='center'>
				<States>
					<StatesIcon name='circle-exclamation' variation='danger' />
					<StatesTitle>{t('Call_not_found')}</StatesTitle>
					<StatesSubtitle>{t('Call_not_found_error')}</StatesSubtitle>
					<StatesActions>
						<StatesAction primary={false} onClick={() => window.close()}>
							{t('Close')}
						</StatesAction>
						{!user && <StatesAction onClick={() => route.push()}>{t('Back_to_login')}</StatesAction>}
					</StatesActions>
				</States>
			</PageContent>
		</Page>
	);
};

export default ConferencePageError;
