import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import EditRoomWithData from './EditRoomWithData';
import RoomsTable from './RoomsTable';
import { ContextualbarDialog } from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';

const RoomsPage = (): ReactElement => {
	const { t } = useTranslation();

	const id = useRouteParameter('id');
	const context = useRouteParameter('context');

	const reloadRef = useRef(() => null);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Rooms')} />
				<PageContent>
					<RoomsTable reload={reloadRef} />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<EditRoomWithData rid={id} onReload={reloadRef.current} />
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default RoomsPage;
