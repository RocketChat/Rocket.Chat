import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatFilterByText from './ChatsTableFilter';
import ChatsTableRow from './ChatsTableRow';
import { useChatsQuery } from './useChatsQuery';
import GenericNoResults from '../../../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../components/GenericTable/hooks/useSort';
import { useOmnichannelPriorities } from '../../../../../omnichannel/hooks/useOmnichannelPriorities';
import { useCurrentChats } from '../../../currentChats/hooks/useCurrentChats';
import { useChatsContext } from '../../contexts/ChatsContext';

const ChatsTable = () => {
	const { t } = useTranslation();
	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const { filtersQuery: filters } = useChatsContext();

	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const chatsQuery = useChatsQuery();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<
		'fname' | 'priorityWeight' | 'source.type' | 'verified' | 'department.name' | 'servedBy' | 'ts' | 'lm' | 'status'
	>('lm', 'desc');

	const query = useMemo(
		() => chatsQuery(filters, [sortBy, sortDirection], current, itemsPerPage),
		[itemsPerPage, filters, sortBy, sortDirection, current, chatsQuery],
	);

	const { data, isLoading, isSuccess, isError, refetch } = useCurrentChats(query);

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='fname' direction={sortDirection} active={sortBy === 'fname'} onClick={setSort} sort='fname'>
				{t('Name')}
			</GenericTableHeaderCell>
			{isPriorityEnabled && (
				<GenericTableHeaderCell
					key='priorityWeight'
					direction={sortDirection}
					active={sortBy === 'priorityWeight'}
					onClick={setSort}
					sort='priorityWeight'
					alignItems='center'
				>
					{t('Priority')}
				</GenericTableHeaderCell>
			)}
			<GenericTableHeaderCell
				key='source.type'
				direction={sortDirection}
				active={sortBy === 'source.type'}
				onClick={setSort}
				sort='source.type'
			>
				{t('Channel')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='servedBy' direction={sortDirection} active={sortBy === 'servedBy'} onClick={setSort} sort='servedBy'>
				{t('Agent')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell w='x100' direction={sortDirection} active={sortBy === 'verified'} onClick={setSort} sort='verified'>
				{t('Verification')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='department.name'
				direction={sortDirection}
				active={sortBy === 'department.name'}
				onClick={setSort}
				sort='department.name'
			>
				{t('Department')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts'>
				{t('Started_At')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='lm' direction={sortDirection} active={sortBy === 'lm'} onClick={setSort} sort='lm'>
				{t('Last_Message')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='status' direction={sortDirection} active={sortBy === 'status'} onClick={setSort} sort='status'>
				{t('Status')}
			</GenericTableHeaderCell>
			{canRemoveClosedChats && <GenericTableHeaderCell key='remove' w='x60' data-qa='current-chats-header-remove' />}
		</>
	);

	return (
		<>
			<ChatFilterByText />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={headers.props.children.filter(Boolean).length} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.rooms.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.rooms.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='message'
					title={t('No_chats_yet')}
					description={t('No_chats_yet_description')}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_conversations')}
				/>
			)}
			{isSuccess && data?.rooms.length > 0 && (
				<>
					<GenericTable fixed={false}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>{data?.rooms.map((room) => <ChatsTableRow key={room._id} {...room} />)}</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default ChatsTable;
