import { Tabs, Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import Page from '../../../components/basic/Page';
import NewIncomingWebhook from './NewIncomingWebhook';
import NewZapier from './NewZapier';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';


export default function NewIntegrationsPage({ ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');
	const [disabledTabs, setDisabledTabs] = useState(false);

	const handleClickTab = (type) => () => {
		router.push({ context: 'new', type });
	};

	const handleClickReturn = () => {
		router.push({ });
	};

	const tab = useRouteParameter('type');

	return <Page flexDirection='column' {...props}>
		<Page.Header title={t('Integrations')} >
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Tabs>
				<Tabs.Item
					selected={tab === 'incoming'}
					onClick={handleClickTab('incoming')}
					disabled={disabledTabs}
				>
					{t('Incoming')}
				</Tabs.Item>
				<Tabs.Item
					selected={tab === 'zapier'}
					onClick={handleClickTab('zapier')}
					disabled={disabledTabs}
				>
					{t('Zapier')}
				</Tabs.Item>
				<Tabs.Item
					selected={tab === 'bots'}
					onClick={handleClickTab('bots')}
					disabled={disabledTabs}
				>
					{t('Bots')}
				</Tabs.Item>
			</Tabs>
			{[
				tab === 'incoming' && <NewIncomingWebhook setDisabledTabs={setDisabledTabs} key='incoming'/>,
				tab === 'bots' && <Box pb='x20' fontScale='s1' key='bots' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Bots') }}/>,
				tab === 'zapier' && <NewZapier key='zapier'/>,
			].filter(Boolean)}
		</Page.ScrollableContentWithShadow>
	</Page>;
}
