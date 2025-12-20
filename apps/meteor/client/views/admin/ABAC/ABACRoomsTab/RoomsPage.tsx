import { Box, Button, Icon, Margins, Pagination, Select, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	usePagination,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMenu from './RoomMenu';
import GenericNoResults from '../../../../components/GenericNoResults';
import { RoomIcon } from '../../../../components/RoomIcon';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import { useIsABACAvailable } from '../hooks/useIsABACAvailable';

const RoomsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();

	const searchTerm = useSearchParameter('searchTerm');
	const searchType = useSearchParameter('type') as 'roomName' | 'attribute' | 'value';

	const [text, setText] = useState(searchTerm ?? '');
	const [filterType, setFilterType] = useState<'all' | 'roomName' | 'attribute' | 'value'>(searchType ?? 'all');
	const debouncedText = useDebouncedValue(text, 200);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const getRooms = useEndpoint('GET', '/v1/abac/rooms');
	const isABACAvailable = useIsABACAvailable();

	const handleNewAttribute = useEffectEvent(() => {
		router.navigate({
			name: 'admin-ABAC',
			params: {
				tab: 'rooms',
				context: 'new',
			},
		});
	});

	const query = useMemo(
		() => ({
			...(debouncedText ? { filter: debouncedText } : {}),
			...(filterType !== 'all' ? { filterType } : {}),
			offset: current,
			count: itemsPerPage,
		}),
		[debouncedText, current, itemsPerPage, filterType],
	);

	// Whenever the user changes the filter or the text, reset the pagination to the first page
	useEffect(() => {
		setCurrent(0);
	}, [debouncedText, filterType, setCurrent]);

	const { data, isLoading } = useQuery({
		queryKey: ABACQueryKeys.rooms.list(query),
		queryFn: () => getRooms(query),
	});

	return (
		<>
			<Margins block={24}>
				<Box display='flex'>
					<TextInput
						addon={<Icon name='magnifier' size='x20' />}
						placeholder={t('ABAC_Search_rooms')}
						value={text}
						onChange={(e) => setText((e.target as HTMLInputElement).value)}
					/>
					<Box pis={8} maxWidth={200}>
						<Select
							options={[
								['all', t('All'), true],
								['roomName', t('Rooms'), false],
								['attribute', t('Attributes'), false],
								['value', t('Values'), false],
							]}
							value={filterType}
							onChange={(value) => setFilterType(value as 'all' | 'roomName' | 'attribute' | 'value')}
						/>
					</Box>
					<Button onClick={handleNewAttribute} primary mis={8} disabled={isABACAvailable !== true}>
						{t('Add_room')}
					</Button>
				</Box>
			</Margins>
			{(!data || data.rooms?.length === 0) && !isLoading ? (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='list-alt' title={t('ABAC_No_rooms')} description={t('ABAC_No_rooms_description')} />
				</Box>
			) : (
				<>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell>{t('Room')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Members')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Attributes')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Attribute_Values')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='spacer' w={40} />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.rooms?.map((room) => (
								<GenericTableRow key={room._id}>
									<GenericTableCell withTruncatedText>
										<Margins inline={8}>
											<RoomIcon room={room} size='x20' />
										</Margins>
										{room.fname || room.name}
									</GenericTableCell>
									<GenericTableCell>{room.usersCount}</GenericTableCell>
									<GenericTableCell withTruncatedText>
										{room.abacAttributes?.flatMap((attribute) => attribute.key ?? []).join(', ')}
									</GenericTableCell>
									<GenericTableCell withTruncatedText>
										{room.abacAttributes?.flatMap((attribute) => attribute.values ?? []).join(', ')}
									</GenericTableCell>
									<GenericTableCell>
										<RoomMenu room={{ rid: room._id, name: room.fname || room.name || room._id }} />
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default RoomsPage;
