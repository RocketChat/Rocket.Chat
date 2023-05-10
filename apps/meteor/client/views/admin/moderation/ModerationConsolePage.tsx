import { useTranslation, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
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
				<VerticalBar>
					{context === 'info' && id && <UserMessages userId={id} onRedirect={handleRedirect} />}
					{context === 'reports' && id && <MessageReportInfo msgId={id} />}
				</VerticalBar>
			)}
		</Page>
	);
};

export default ModerationConsolePage;
