import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRoute, useSetting, useTranslation, useCurrentRoute, useRouteParameter, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import Page from '../../../components/Page';
import AppsPageContent from './AppsPageContent';

const AppsPage = (): ReactElement => {
	const t = useTranslation();

	const isAdminUser = usePermission('manage-apps');
	const isDevelopmentMode = useSetting('Apps_Framework_Development_Mode');

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);

	const context = useRouteParameter('context');

	const handleUploadButtonClick = (): void => {
		context && router.push({ context, page: 'install' });
	};

	const AppsTitles: { [key: string]: string } = {
		explore: 'Explore',
		installed: 'Installed',
		enterprise: 'Enterprise',
		requested: 'Requested',
		private: 'Private apps',
	};

	return (
		<Page background='tint'>
			<Page.Header title={context && t(AppsTitles[context] as TranslationKey)}>
				<ButtonGroup>
					{Boolean(isDevelopmentMode) && isAdminUser && context === 'private' && (
						<Button primary onClick={handleUploadButtonClick}>
							<Icon size='x20' name='upload' /> {t('Upload_app')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Page.Content paddingInline='0'>
				<AppsPageContent />
			</Page.Content>
		</Page>
	);
};

export default AppsPage;
