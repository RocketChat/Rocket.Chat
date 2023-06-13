import { useRouteParameter, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import EditRoomContextBar from './EditRoomContextBar';
import RoomsTable from './RoomsTable';

const RoomsPage = (): ReactElement => {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const roomsRoute = useRoute('admin-rooms');

	const handleContextualbarCloseButtonClick = (): void => {
		roomsRoute.push({});
	};

	const reloadRef = useRef(() => null);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Rooms')} />
				<Page.Content>
					<RoomsTable reload={reloadRef} />
				</Page.Content>
			</Page>
			{context && (
				<Contextualbar>
					<ContextualbarHeader>
						<ContextualbarTitle>{t('Room_Info')}</ContextualbarTitle>
						<ContextualbarClose onClick={handleContextualbarCloseButtonClick} />
					</ContextualbarHeader>
					<EditRoomContextBar rid={id} onReload={reloadRef.current} />
				</Contextualbar>
			)}
		</Page>
	);
};

export default RoomsPage;
