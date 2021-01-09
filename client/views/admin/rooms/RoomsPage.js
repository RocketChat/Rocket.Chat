import React,{useCallback,useEffect,useState} from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import {RoomsPageProvider} from './contexts/RoomsPageContext'
import { EditRoomContextBar } from './EditRoom';
import RoomsTable from './RoomsTable';

export function RoomsPage() {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const roomsRoute = useRoute('admin-rooms');

	const closeVerticalBar = useCallback(()=>{
		roomsRoute.push({});
	},[roomsRoute])

	const [deleted,setDeleted] = useState(false);

	useEffect(()=>{
		if(deleted){
			closeVerticalBar();
			setDeleted(true);
		}
	},[deleted,closeVerticalBar]);

	return (<RoomsPageProvider deleted={deleted} setDeleted={setDeleted}>
	 <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Rooms')} />
			<Page.Content>
				<RoomsTable />
			</Page.Content>
		</Page>
		{context && <VerticalBar>
			<VerticalBar.Header>
				{t('Room_Info')}
				<VerticalBar.Close onClick={closeVerticalBar} />
			</VerticalBar.Header>

			<EditRoomContextBar rid={id} />
		</VerticalBar>}
	</Page>
	</RoomsPageProvider>);
}

export default RoomsPage;
