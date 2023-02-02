import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import Page from '../../../components/Page';
import ModerationConsoleTable from './ModerationConsoleTable';

const ModerationConsolePage = () => {
	const t = useTranslation();

	const reloadRef = useRef(() => null);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Moderation_Console')} />
				<Page.Content>
					<h1>Moderation Console</h1>
					<ModerationConsoleTable reload={reloadRef} />
				</Page.Content>
			</Page>
		</Page>
	);
};

export default ModerationConsolePage;
