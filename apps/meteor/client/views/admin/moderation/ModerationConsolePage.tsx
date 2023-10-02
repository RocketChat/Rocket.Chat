import { useTranslation, useRouteParameter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React from 'react';

import { Contextualbar } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import { getPermaLink } from '../../../lib/getPermaLink';
import ModerationConsoleTable from './ModerationConsoleTable';
import UserMessages from './UserMessages';

const ModerationConsolePage = () => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRedirect = async (mid: string) => {
		try {
			const permalink = await getPermaLink(mid);
			// open the permalink in same tab
			window.open(permalink, '_self');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Moderation')} />
				<Page.Content>
					<ModerationConsoleTable />
				</Page.Content>
			</Page>
			{context && <Contextualbar>{context === 'info' && id && <UserMessages userId={id} onRedirect={handleRedirect} />}</Contextualbar>}
		</Page>
	);
};

export default ModerationConsolePage;
