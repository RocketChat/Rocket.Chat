import { Tag, Box, Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { hashQueryKey } from '@tanstack/react-query';
import moment from 'moment';
import React, { useState, useMemo, useCallback } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useCurrentChats } from '../../currentChats/hooks/useCurrentChats';

const ChatTable = () => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const userIdLoggedIn = useUserId();
	const directoryRoute = useRoute('omnichannel-directory');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'fname' | 'department' | 'ts' | 'chatDuration' | 'closedAt'>('fname');

	const query = useMemo(
		() => ({
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			open: false,
			roomName: text || '',
			agents: userIdLoggedIn ? [userIdLoggedIn] : [],
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[sortBy, current, sortDirection, itemsPerPage, userIdLoggedIn, text],
	);

	const onRowClick = useMutableCallback((id) =>
		directoryRoute.push({
			page: 'chats',
			bar: 'info',
			id,
		}),
	);

	const headers = (
		<>
			<GenericTableHeaderCell key='fname' direction={sortDirection} active={sortBy === 'fname'} onClick={setSort} sort='fname' w='x400'>
				{t('Contact_Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='department'
				direction={sortDirection}
				active={sortBy === 'department'}
				onClick={setSort}
				sort='department'
				w='x200'
			>
				{t('Department')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts' w='x200'>
				{t('Started_At')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='chatDuration'
				direction={sortDirection}
				active={sortBy === 'chatDuration'}
				onClick={setSort}
				sort='chatDuration'
				w='x120'
			>
				{t('Chat_Duration')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='closedAt'
				direction={sortDirection}
				active={sortBy === 'closedAt'}
				onClick={setSort}
				sort='closedAt'
				w='x200'
			>
				{t('Closed_At')}
			</GenericTableHeaderCell>
		</>
	);

	const { data, isLoading, isSuccess, isError, refetch } = useCurrentChats(query);

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const renderRow = useCallback(
		({ _id, fname, ts, closedAt, department, tags }) => (
			<GenericTableRow key={_id} tabIndex={0} role='link' onClick={(): void => onRowClick(_id)} action qa-user-id={_id}>
				<GenericTableCell withTruncatedText>
					<Box display='flex' flexDirection='column'>
						<Box withTruncatedText>{fname}</Box>
						{tags && (
							<Box color='hint' display='flex' flex-direction='row'>
								{tags.map((tag: string) => (
									<Box
										style={{
											marginTop: 4,
											whiteSpace: 'nowrap',
											overflow: tag.length > 10 ? 'hidden' : 'visible',
											textOverflow: 'ellipsis',
										}}
										key={tag}
										mie={4}
									>
										<Tag style={{ display: 'inline' }} disabled>
											{tag}
										</Tag>
									</Box>
								))}
							</Box>
						)}
					</Box>
				</GenericTableCell>
				<GenericTableCell withTruncatedText>{department ? department.name : ''}</GenericTableCell>
				<GenericTableCell withTruncatedText>{moment(ts).format('L LTS')}</GenericTableCell>
				<GenericTableCell withTruncatedText>{moment(closedAt).from(moment(ts), true)}</GenericTableCell>
				<GenericTableCell withTruncatedText>{moment(closedAt).format('L LTS')}</GenericTableCell>
			</GenericTableRow>
		),
		[onRowClick],
	);

	return (
		<>
			{((isSuccess && data?.rooms.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }) => setText(text)} />}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.rooms.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.rooms.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='message'
					title={t('No_chats_yet')}
					description={t('No_chats_yet_description')}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_conversations')}
				/>
			)}
			{isSuccess && data?.rooms.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>{data?.rooms.map((room) => renderRow(room))}</GenericTableBody>
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

export default ChatTable;
