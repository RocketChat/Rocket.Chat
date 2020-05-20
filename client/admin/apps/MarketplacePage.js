import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import MarketplaceTable from './MarketplaceTable';

function MarketplacePage() {
	const t = useTranslation();
	const [modal, setModal] = useState(null);

	const cloudRouter = useRoute('cloud');

	const getLoggedInCloud = useMethod('cloud:checkUserLoggedIn');
	const isLoggedInCloud = getLoggedInCloud();

	return <><Page flexDirection='column'>
		<Page.Header title={t('Marketplace')}>
			{isLoggedInCloud && <ButtonGroup>
				<Button onClick={() => { cloudRouter.push({}); }}>
					<Icon name='download'/> {t('Login')}
				</Button>
			</ButtonGroup>}
		</Page.Header>
		<Page.Content>
			<MarketplaceTable setModal={setModal}/>
		</Page.Content>
	</Page>{ modal }</>;
}

export default MarketplacePage;
