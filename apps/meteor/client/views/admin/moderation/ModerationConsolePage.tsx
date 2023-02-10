import { useTranslation, useRouteParameter, useRoute } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import MessageReportInfo from './MessageReportInfo';
import ModerationConsoleTable from './ModerationConsoleTable';

const ModerationConsolePage = () => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const moderationRoute = useRoute('moderation-console');

	console.log('context', context);

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
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Report')}</VerticalBar.Text>
						<VerticalBar.Action name={'new-window'} onClick={() => moderationRoute.push({})} title={t('View_full_conversation')} />
						<VerticalBar.Close onClick={() => moderationRoute.push({})} />
					</VerticalBar.Header>
					<VerticalBar.Content>{context === 'info' && id && <MessageReportInfo msgId={id} reload={reloadRef} />}</VerticalBar.Content>
				</VerticalBar>
			)}
		</Page>
	);
};

export default ModerationConsolePage;
