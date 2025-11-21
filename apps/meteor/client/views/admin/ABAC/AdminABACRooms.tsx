import { Box, Button, Icon, Margins, Pagination, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AdminABACRoomMenu from './AdminABACRoomMenu';
import useIsABACAvailable from './hooks/useIsABACAvailable';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { ABACQueryKeys } from '../../../lib/queryKeys';

const AdminABACRooms = () => {
	const { t } = useTranslation();

	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 200);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const getRooms = useEndpoint('GET', '/v1/abac/rooms');
	const isABACAvailable = useIsABACAvailable();

	const router = useRouter();
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
			...(debouncedText ? { key: debouncedText, values: debouncedText } : {}),
			offset: current,
			count: itemsPerPage,
		}),
		[debouncedText, current, itemsPerPage],
	);

	const { data, isLoading } = useQuery({
		queryKey: ABACQueryKeys.roomAttributes.roomAttributesList(query),
		queryFn: () => getRooms(),
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
					<Button onClick={handleNewAttribute} primary mis={8} disabled={isABACAvailable !== true}>
						{t('Add_room')}
					</Button>
				</Box>
			</Margins>
			{(!data || data.rooms?.length === 0) && !isLoading ? (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='list-alt' title={t('No_attributes')} description={t('No_attributes_description')} />
				</Box>
			) : (
				<>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell>{t('Room')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Members')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Attributes')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Attributes_Values')}</GenericTableHeaderCell>
							<GenericTableHeaderCell key='spacer' w={40} />
						</GenericTableHeader>
						<GenericTableBody>
							{data?.rooms.map((room) => (
								<GenericTableRow key={room._id}>
									<GenericTableCell>{room.name}</GenericTableCell>
									<GenericTableCell>{room.usersCount}</GenericTableCell>
									<GenericTableCell>{room.abacAttributes?.map((attribute) => attribute.key).join(', ')}</GenericTableCell>
									<GenericTableCell>{room.abacAttributes?.map((attribute) => attribute.values?.join(', '))}</GenericTableCell>
									<GenericTableCell>
										<AdminABACRoomMenu room={{ rid: room._id, name: room.name }} />
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

export default AdminABACRooms;
