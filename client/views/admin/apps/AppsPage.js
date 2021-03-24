import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import AppsTable from './AppsTable';

function AppsPage() {
	const t = useTranslation();

	const isDevelopmentMode = useSetting('Apps_Framework_Development_Mode');
	const marketplaceRoute = useRoute('admin-marketplace');
	const appsRoute = useRoute('admin-apps');

	const handleUploadButtonClick = () => {
		appsRoute.push({ context: 'install' });
	};

	const handleViewMarketplaceButtonClick = () => {
		marketplaceRoute.push();
	};

	return <Page>
		<Page.Header title={t('Apps')}>
			<ButtonGroup>
				{isDevelopmentMode && <Button primary onClick={handleUploadButtonClick}>
					<Icon size='x20' name='upload' /> {t('Upload_app')}
				</Button>}
				<Button primary onClick={handleViewMarketplaceButtonClick}>
					<Icon size='x20' name='download' /> {t('Marketplace_view_marketplace')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<AppsTable />
		</Page.Content>
	</Page>;
}

export default AppsPage;
