import React from 'react';

import Page from '../../components/basic/Page';
import VerticalBar from '../../components/basic/VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../contexts/RouterContext';
import { EditRoomContextBar } from './EditRoom';
import RoomsTable from './RoomsTable';

export function RoomsPage() {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const roomsRoute = useRoute('admin-rooms');

	const handleVerticalBarCloseButtonClick = () => {
		roomsRoute.push({});
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Rooms')} />
			<Page.Content>
				<RoomsTable />
			</Page.Content>
		</Page>
		{context && <VerticalBar className='contextual-bar'>
			<VerticalBar.Header>
				{t('Room_Info')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>

			<EditRoomContextBar rid={id} />
		</VerticalBar>}
	</Page>;
}

export default RoomsPage;
