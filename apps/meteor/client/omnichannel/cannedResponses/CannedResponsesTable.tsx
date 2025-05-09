import { Box, IconButton, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, usePermission, useToastMessageDispatch, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { hashKey, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import CannedResponseFilter from './CannedResponseFilter';
import { useRemoveCannedResponse } from './useRemoveCannedResponse';
import GenericNoResults from '../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
	GenericTableCell,
} from '../../components/GenericTable';
import { usePagination } from '../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../components/GenericTable/hooks/useSort';
import { useFormatDateAndTime } from '../../hooks/useFormatDateAndTime';

type Scope = 'global' | 'department' | 'user';

const CannedResponsesTable = () => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const getTime = useFormatDateAndTime();

	const isMonitor = usePermission('save-department-canned-responses');
	const isManager = usePermission('save-all-canned-responses');

	const [createdBy, setCreatedBy] = useState('all');
	const [sharing, setSharing] = useState<'' | 'user' | 'global' | 'department'>('');
	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 500);

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, setSort, sortDirection } = useSort<'shortcut' | 'scope' | 'tags' | '_createdAt' | 'createdBy'>('shortcut');

	const query = useMemo(
		() => ({
			text: debouncedText,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(sharing && { scope: sharing }),
			...(createdBy && createdBy !== 'all' && { createdBy }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[createdBy, current, debouncedText, itemsPerPage, sharing, sortBy, sortDirection],
	);

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses');
	const { data, isLoading, isSuccess } = useQuery({
		queryKey: ['getCannedResponses', query],
		queryFn: () => getCannedResponses(query),
		refetchOnWindowFocus: false,
	});

	const handleAddNew = useEffectEvent(() => router.navigate('/omnichannel/canned-responses/new'));

	const onRowClick = useEffectEvent((id: string, scope: string) => (): void => {
		if (scope === 'global' && isMonitor && !isManager) {
			return dispatchToastMessage({
				type: 'error',
				message: t('Not_authorized'),
			});
		}

		router.navigate(`/omnichannel/canned-responses/edit/${id}`);
	});

	const handleDelete = useRemoveCannedResponse();

	const defaultOptions = useMemo(
		() => ({
			global: t('Public'),
			department: t('Department'),
			user: t('Private'),
		}),
		[t],
	);

	const headers = (
		<>
			<GenericTableHeaderCell key='shortcut' direction={sortDirection} active={sortBy === 'shortcut'} onClick={setSort} sort='shortcut'>
				{t('Shortcut')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='sharing' direction={sortDirection} active={sortBy === 'scope'} onClick={setSort} sort='scope'>
				{t('Sharing')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='createdBy' direction={sortDirection} active={sortBy === 'createdBy'} onClick={setSort} sort='createdBy'>
				{t('Created_by')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='createdAt'
				direction={sortDirection}
				active={sortBy === '_createdAt'}
				onClick={setSort}
				sort='_createdAt'
			>
				{t('Created_at')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='tags' direction={sortDirection} active={sortBy === 'tags'} onClick={setSort} sort='tags'>
				{t('Tags')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='remove' w='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{((isSuccess && data?.cannedResponses.length > 0) || queryHasChanged) && (
				<CannedResponseFilter
					createdBy={createdBy}
					setCreatedBy={setCreatedBy}
					sharing={sharing}
					setSharing={setSharing}
					text={text}
					setText={setText}
				/>
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={6} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.cannedResponses.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.cannedResponses.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='baloon-exclamation'
					title={t('No_Canned_Responses_Yet')}
					description={t('No_Canned_Responses_Yet-description')}
					buttonTitle={t('Create_canned_response')}
					buttonAction={handleAddNew}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_canned_responses')}
				/>
			)}
			{isSuccess && data?.cannedResponses.length > 0 && (
				<>
					<GenericTable aria-busy={text !== debouncedText}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.cannedResponses.map(({ _id, shortcut, scope, createdBy, _createdAt, tags = [] }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={onRowClick(_id, scope)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{shortcut}</GenericTableCell>
									<GenericTableCell withTruncatedText>{defaultOptions[scope as Scope]}</GenericTableCell>
									<GenericTableCell withTruncatedText>
										<Box display='flex' alignItems='center'>
											<UserAvatar size='x24' username={createdBy.username} />
											<Box display='flex' withTruncatedText mi={8}>
												<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
													<Box fontScale='p2m' withTruncatedText color='default'>
														{createdBy.username}
													</Box>
												</Box>
											</Box>
										</Box>
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{getTime(_createdAt)}</GenericTableCell>
									<GenericTableCell withTruncatedText>{tags.join(', ')}</GenericTableCell>
									{!(scope === 'global' && isMonitor && !isManager) && (
										<GenericTableCell withTruncatedText>
											<IconButton
												icon='trash'
												small
												title={t('Remove')}
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(_id);
												}}
											/>
										</GenericTableCell>
									)}
								</GenericTableRow>
							))}
						</GenericTableBody>
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
		</>
	);
};

export default CannedResponsesTable;
