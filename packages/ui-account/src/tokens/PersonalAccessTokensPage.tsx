import { Page, PageHeader, PageContent } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { usePersonalAccessTokens } from './logic/usePersonalAccessTokens';
import PersonalAccessTokensView from './views/PersonalAccessTokensView';

const PersonalAccessTokensPage = () => {
	const { t } = useTranslation();
	const vm = usePersonalAccessTokens();

	return (
		<Page>
			<PageHeader title={t('Personal_Access_Tokens')} />
			<PageContent>
				<PersonalAccessTokensView vm={vm} />
			</PageContent>
		</Page>
	);
};

export default PersonalAccessTokensPage;
