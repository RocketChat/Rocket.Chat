import { useRouteParameter, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import EditRoomContextBar from './EditRoomContextBar';
import RoomsTable from './RoomsTable';

const RoomsPage = (): ReactElement => {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const roomsRoute = useRoute('admin-rooms');

	const handleVerticalBarCloseButtonClick = (): void => {
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
				<VerticalBar>
					<VerticalBar.Header>
						<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
						<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
					</VerticalBar.Header>
					<EditRoomContextBar rid={id} onReload={reloadRef.current} />
				</VerticalBar>
			)}
		</Page>
	);
};

export default RoomsPage;
