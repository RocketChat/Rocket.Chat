import { Box, Pagination, type TableColumnWidth, Text } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
	GenericTableCell,
	getCombineFn,
	usePaginatedQuery,
	usePagination,
	useSort,
	GenericNoResults,
	useFormatDateAndTime,
} from '@rocket.chat/ui-client';
import { useTranslation, usePermission, useToastMessageDispatch, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import CannedResponseFilter from './CannedResponseFilter';
import { links } from '../../../../lib/links';
import RemoveCannedResponseButton from '../RemoveCannedResponseButton';

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

	const { sortBy, setSort, sortDirection } = useSort<'shortcut' | 'scope' | 'tags' | '_createdAt' | 'createdBy'>('shortcut');

	const query = useMemo(
		() => ({
			text: debouncedText,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(sharing && { scope: sharing }),
			...(createdBy && createdBy !== 'all' && { createdBy }),
		}),
		[createdBy, debouncedText, sharing, sortBy, sortDirection],
	);

	const queryKey = ['getCannedResponses', query];
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ resetKey: queryKey });

	const [defaultQuery] = useState(hashKey([query, current, itemsPerPage]));
	const queryHasChanged = defaultQuery !== hashKey([query, current, itemsPerPage]);

	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses');
	const { data, isLoading, isSuccess } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getCannedResponses,
		combineData: getCombineFn('cannedResponses'),
		offset: current,
		count: itemsPerPage,
		refetchOnWindowFocus: false,
	});

	const handleAddNew = useStableCallback(() => router.navigate('/omnichannel/canned-responses/new'));

	const onRowClick = useStableCallback((id: string, scope: string) => (): void => {
		if (scope === 'global' && isMonitor && !isManager) {
			return dispatchToastMessage({
				type: 'error',
				message: t('Not_authorized'),
			});
		}

		router.navigate(`/omnichannel/canned-responses/edit/${id}`);
	});

	const defaultOptions = useMemo(
		() => ({
			global: t('Public'),
			department: t('Department'),
			user: t('Private'),
		}),
		[t],
	);

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'auto', 'auto', 'x60'];

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
			<GenericTableHeaderCell key='remove'>{t('Remove')}</GenericTableHeaderCell>
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
				<GenericTable columns={columns}>
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
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_canned_responses')}
				/>
			)}
			{isSuccess && data?.cannedResponses.length > 0 && (
				<>
					<GenericTable columns={columns} aria-label={t('Canned_Responses')} aria-busy={text !== debouncedText}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.cannedResponses.map(({ _id, shortcut, scope, createdBy, _createdAt, tags = [] }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={onRowClick(_id, scope)} action>
									<GenericTableCell truncate>{shortcut}</GenericTableCell>
									<GenericTableCell truncate>{defaultOptions[scope as Scope]}</GenericTableCell>
									<GenericTableCell truncate>
										<Box display='flex' alignItems='center'>
											<UserAvatar size='x24' username={createdBy.username} />
											<Box display='flex' withTruncatedText marginInline={8}>
												<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
													<Text fontScale='p2m' truncate color='default'>
														{createdBy.username}
													</Text>
												</Box>
											</Box>
										</Box>
									</GenericTableCell>
									<GenericTableCell truncate>{getTime(_createdAt)}</GenericTableCell>
									<GenericTableCell truncate>{tags.join(', ')}</GenericTableCell>
									{!(scope === 'global' && isMonitor && !isManager) && <RemoveCannedResponseButton id={_id} />}
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
