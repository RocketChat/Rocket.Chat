import { Box, Button, Icon, Margins, Pagination, Select, TextInput, Stack, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	getCombineFn,
	usePaginatedQuery,
	usePagination,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RoomMenu from './RoomMenu';
import { RoomIcon } from '../../../../components/RoomIcon';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import { useIsABACAvailable } from '../hooks/useIsABACAvailable';
import { useIsExternalAttributeStore } from '../hooks/useIsExternalAttributeStore';

const RoomsPage = () => {
	const { t } = useTranslation();
	const router = useRouter();

	const searchTerm = useSearchParameter('searchTerm');
	const searchType = useSearchParameter('type') as 'roomName' | 'attribute' | 'value';

	const [text, setText] = useState(searchTerm ?? '');
	const [filterType, setFilterType] = useState<'all' | 'roomName' | 'attribute' | 'value'>(searchType ?? 'all');
	const debouncedText = useDebouncedValue(text, 200);
	const getRooms = useEndpoint('GET', '/v1/abac/rooms');
	const isABACAvailable = useIsABACAvailable();
	const isExternalStore = useIsExternalAttributeStore();

	const handleNewAttribute = useStableCallback(() => {
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
		}),
		[debouncedText, filterType],
	);

	const queryKey = ABACQueryKeys.rooms.list(query);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination({ resetKey: queryKey });

	const { data, isLoading } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getRooms,
		combineData: getCombineFn('rooms'),
		offset: current,
		count: itemsPerPage,
		...(isExternalStore && { staleTime: 0, gcTime: 0 }),
	});

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'auto', 40];

	return (
		<>
			<Margins block={24}>
				<Stack direction='row' gap={8}>
					<TextInput
						endAddon={<Icon name='magnifier' size='x20' />}
						placeholder={t('ABAC_Search_rooms')}
						value={text}
						onChange={(e) => setText((e.target as HTMLInputElement).value)}
					/>
					<Box maxWidth={192}>
						<Select
							aria-label={t('Filter')}
							options={[
								['all', t('All'), true],
								['roomName', t('Rooms'), false],
								['attribute', t('Attributes'), false],
								['value', t('Values'), false],
							]}
							value={filterType}
							onChange={(value) => setFilterType(value)}
						/>
					</Box>
					<Button onClick={handleNewAttribute} variant='primary' disabled={isABACAvailable !== true}>
						{t('Add_room')}
					</Button>
				</Stack>
			</Margins>
			{(!data || data.rooms?.length === 0) && !isLoading ? (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='list-alt' title={t('ABAC_No_rooms')} description={t('ABAC_No_rooms_description')} />
				</Box>
			) : (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>
							<GenericTableHeaderCell>{t('Room')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Members')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Attributes')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Attribute_Values')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='spacer' />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.rooms?.map((room) => (
								<GenericTableRow key={room._id}>
									<GenericTableCell truncate>
										<Margins inline={8}>
											<RoomIcon room={room} size='x20' />
										</Margins>
										{room.fname || room.name}
									</GenericTableCell>
									<GenericTableCell>{room.usersCount}</GenericTableCell>
									<GenericTableCell truncate>
										{room.abacAttributesRedacted
											? t('ABAC_Redacted_Placeholder')
											: room.abacAttributes?.flatMap((attribute) => attribute.key ?? []).join(', ')}
									</GenericTableCell>
									<GenericTableCell truncate>
										{room.abacAttributesRedacted
											? t('ABAC_Redacted_Placeholder')
											: room.abacAttributes?.flatMap((attribute) => attribute.values ?? []).join(', ')}
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
