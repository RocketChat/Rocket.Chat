import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import Page from '../../../components/Page';
import ServerLogs from './ServerLogs';

const ViewLogsPage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Page>
			<Page.Header title={t('View_Logs')} />
			<Page.Content>
				<ServerLogs />
			</Page.Content>
		</Page>
	);
};

export default ViewLogsPage;
