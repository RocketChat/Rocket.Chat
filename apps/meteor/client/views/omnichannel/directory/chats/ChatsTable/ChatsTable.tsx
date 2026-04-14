import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	usePagination,
	useSort,
} from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatFilterByText from './ChatsTableFilter';
import ChatsTableRow from './ChatsTableRow';
import { useCurrentChats } from './hooks/useCurrentChats';
import { useChatsQuery } from './useChatsQuery';
import GenericNoResults from '../../../../../components/GenericNoResults/GenericNoResults';
import { links } from '../../../../../lib/links';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';
import { useChatsContext } from '../../contexts/ChatsContext';

const ChatsTable = () => {
	const { t } = useTranslation();
	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const { filtersQuery: filters } = useChatsContext();

	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const chatsQuery = useChatsQuery();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'fname' | 'ts'>('ts', 'desc');

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
				<GenericTableHeaderCell key='priorityWeight' alignItems='center'>
					{t('Priority')}
				</GenericTableHeaderCell>
			)}
			<GenericTableHeaderCell key='source.type'>{t('Channel')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='servedBy'>{t('Agent')}</GenericTableHeaderCell>
			<GenericTableHeaderCell w='x100'>{t('Verification')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='department.name'>{t('Department')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts'>
				{t('Started_At')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='lm'>{t('Last_Message')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='status'>{t('Status')}</GenericTableHeaderCell>
			{canRemoveClosedChats && <GenericTableHeaderCell key='remove' w='x60' />}
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
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_conversations')}
				/>
			)}
			{isSuccess && data?.rooms.length > 0 && (
				<>
					<GenericTable aria-label={t('Omnichannel_Contact_Center_Chats')} fixed={false}>
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
