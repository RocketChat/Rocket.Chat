import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditRoomContextBar from './EditRoomContextBar';
import RoomsTable from './RoomsTable';

export const DEFAULT_TYPES = ['d', 'p', 'c', 'teams'];

const useQuery = ({ text, types, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			filter: text || '',
			types,
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, types, itemsPerPage, current, column, direction],
	);

export function RoomsPage() {
	const t = useTranslation();

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const roomsRoute = useRoute('admin-rooms');

	const handleVerticalBarCloseButtonClick = () => {
		roomsRoute.push({});
	};

	const [params, setParams] = useState({
		text: '',
		types: DEFAULT_TYPES,
		current: 0,
		itemsPerPage: 25,
	});
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const endpointData = useEndpointData('rooms.adminRooms', query);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Rooms')} />
				<Page.Content>
					<RoomsTable endpointData={endpointData} params={params} onChangeParams={setParams} sort={sort} onChangeSort={setSort} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						{t('Room_Info')}
						<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
					</VerticalBar.Header>

					<EditRoomContextBar rid={id} onReload={endpointData.reload} />
				</VerticalBar>
			)}
		</Page>
	);
}

export default RoomsPage;
