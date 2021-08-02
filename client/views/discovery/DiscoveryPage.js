import { Tabs } from '@rocket.chat/fuselage';
import React, { useEffect, useCallback } from 'react';

import Page from '../../components/Page';
import { useCurrentRoute, useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import ChannelsTab from './ChannelsTab';
import RecommendedTab from './RecommendedTab';
import TrendingTab from './TrendingTab';

function DiscoveryPage() {
	const t = useTranslation();

	const defaultTab = useSetting('Accounts_Discovery_DefaultView');
	const federationEnabled = useSetting('FEDERATION_Enabled');
	const [routeName] = useCurrentRoute();
	const tab = useRouteParameter('tab');
	const tag = useRouteParameter('tag');
	const discoveryRoute = useRoute('discovery');

	useEffect(() => {
		if (routeName !== 'discovery') {
			return;
		}

		if (!tab) {
			return discoveryRoute.replace({ tab: defaultTab });
		}
	}, [routeName, discoveryRoute, tab, federationEnabled, defaultTab]);

	const handleTabClick = useCallback((tab) => () => discoveryRoute.push({ tab }), [discoveryRoute]);

	return (
		<Page>
			<Page.Header title={t('Channel_Discovery')} />
			<Tabs flexShrink={0}>
				<Tabs.Item selected={tab === 'trending'} onClick={handleTabClick('trending')}>
					{t('Trending')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'recommended'} onClick={handleTabClick('recommended')}>
					{t('Recommended')}
				</Tabs.Item>
				<Tabs.Item selected={tab === 'all'} onClick={handleTabClick('all')}>
					{t('All')}
				</Tabs.Item>
			</Tabs>
			<Page.Content>
				{(tab === 'trending' && <TrendingTab />) ||
					(tab === 'recommended' && <RecommendedTab />) ||
					(tab === 'all' && <ChannelsTab tag={tag} />)}
			</Page.Content>
		</Page>
	);
}

DiscoveryPage.displayName = 'DiscoveryPage';

export default DiscoveryPage;
