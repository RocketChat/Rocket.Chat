import { Button, ButtonGroup, Icon, Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useCallback } from 'react';

import Page from '../../components/basic/Page';
import { Apps } from '../../../app/apps/client/orchestrator';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import MarketplaceTable from './MarketplaceTable';

function MarketplacePage() {
	const t = useTranslation();

	const cloudRouter = useRoute('cloud');

	// const handleNewButtonClick = useCallback(() => {
	// 	router.push({ context: 'new', type: 'incoming' });
	// }, []);

	// const context = useRouteParameter('context');
	// useEffect(() => {
	// 	if (!context) {
	// 		router.push({ context: 'webhook-incoming' });
	// 	}
	// }, [context]);

	const getLoggedInCloud = useMethod('cloud:checkUserLoggedIn');
	const isLoggedInCloud = getLoggedInCloud();

	useEffect(() => {
		(async () => console.log(await Apps.getAppsFromMarketplace()))();
	}, []);

	return <Page flexDirection='column'>
		<Page.Header title={t('Marketplace')}>
			{isLoggedInCloud && <ButtonGroup>
				<Button onClick={() => { cloudRouter.push({}); }}>
					<Icon name='download'/> {t('Login')}
				</Button>
			</ButtonGroup>}
		</Page.Header>
		<Page.Content>
			{/* <MarketplaceTable /> */}
		</Page.Content>
	</Page>;
}

export default MarketplacePage;
