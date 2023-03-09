import { useTranslation, useRouteParameter, useRoute } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import MessageReportInfo from './MessageReportInfo';
import ModerationConsoleTable from './ModerationConsoleTable';
import UserMessages from './UserMessages';

const ModerationConsolePage = () => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const moderationRoute = useRoute('moderation-console');

	console.log('context', context);

	const reloadRef = useRef(() => null);

	const handleReload = (): void => {
		reloadRef.current();
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Moderation_Console')} />
				<Page.Content>
					<h1>Moderation Console</h1>
					<ModerationConsoleTable reload={reloadRef} onReload={handleReload} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						<VerticalBar.Icon name='info-circled' />
						{context === 'info' && <VerticalBar.Text>{t('Messages')}</VerticalBar.Text>}
						{context === 'reports' && <VerticalBar.Text>{t('Report')}</VerticalBar.Text>}
						{/* <VerticalBar.Action name={'new-window'} onClick={() => moderationRoute.push({})} title={t('View_full_conversation')} /> */}
						<VerticalBar.Close onClick={() => moderationRoute.push({})} />
					</VerticalBar.Header>
					{context === 'info' && id && <UserMessages userId={id} reload={reloadRef} />}

					{context === 'reports' && id && <MessageReportInfo msgId={id} reload={reloadRef} />}
				</VerticalBar>
			)}
		</Page>
	);
};

export default ModerationConsolePage;
