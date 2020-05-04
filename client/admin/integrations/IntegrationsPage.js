import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import IntegrationsTable from './IntegrationsTable';

function IntegrationsPage() {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const handleNewButtonClick = () => {
		router.push({ context: 'new', tab: 'webhooks' });
	};

	return <Page flexDirection='column'>
		<Page.Header title={t('Integrations')}>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick}>
					<Icon name='plus'/> {t('New')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<IntegrationsTable />
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default IntegrationsPage;
