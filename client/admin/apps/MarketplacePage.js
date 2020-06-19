import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../components/basic/Page';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLoggedInCloud } from './hooks/useLoggedInCloud';
import MarketplaceTable from './MarketplaceTable';

function MarketplacePage() {
	const t = useTranslation();
	const cloudRoute = useRoute('cloud');
	const isLoggedIn = useLoggedInCloud();

	const handleLoginButtonClick = () => {
		cloudRoute.push();
	};

	return <Page>
		<Page.Header title={t('Marketplace')}>
			{!isLoggedIn && <ButtonGroup>
				<Button onClick={handleLoginButtonClick}>
					<Icon name='download'/> {t('Login')}
				</Button>
			</ButtonGroup>}
		</Page.Header>
		<Page.Content>
			<MarketplaceTable />
		</Page.Content>
	</Page>;
}

export default MarketplacePage;
