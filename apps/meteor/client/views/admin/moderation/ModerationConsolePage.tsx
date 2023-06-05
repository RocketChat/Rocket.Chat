import { useTranslation, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { Contextualbar } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import MessageReportInfo from './MessageReportInfo';
import ModerationConsoleTable from './ModerationConsoleTable';
import UserMessages from './UserMessages';

const ModerationConsolePage = () => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRedirect = async (mid: string) => {
		try {
			const permalink = await MessageAction.getPermaLink(mid);
			// open the permalink in same tab
			window.open(permalink, '_self');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Moderation_Console')} />
				<Page.Content>
					<ModerationConsoleTable />
				</Page.Content>
			</Page>
			{context && (
				<Contextualbar>
					{context === 'info' && id && <UserMessages userId={id} onRedirect={handleRedirect} />}
					{context === 'reports' && id && <MessageReportInfo msgId={id} />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default ModerationConsolePage;
