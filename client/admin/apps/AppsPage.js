import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../components/basic/Page';
import { useSetModal } from '../../contexts/ModalContext';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import AppsTable from './AppsTable';

function AppsPage() {
	const t = useTranslation();
	const setModal = useSetModal();

	const marketplaceRouter = useRoute('admin-marketplace');
	const appsRouter = useRoute('admin-apps');

	const isDevelopmentMode = useSetting('Apps_Framework_Development_Mode');

	return <Page flexDirection='column'>
		<Page.Header title={t('Apps')}>
			<ButtonGroup>
				{isDevelopmentMode && <Button primary onClick={() => { appsRouter.push({ context: 'install' }); }}>
					<Icon size='x20' name='upload'/> {t('Upload_app')}
				</Button>}
				<Button primary onClick={() => { marketplaceRouter.push({}); }}>
					<Icon size='x20' name='download'/> {t('Marketplace_view_marketplace')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.Content>
			<AppsTable setModal={setModal}/>
		</Page.Content>
	</Page>;
}

export default AppsPage;
