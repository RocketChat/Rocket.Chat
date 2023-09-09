import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, usePermission, useToastMessageDispatch, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import GenericNoResults from '../../../../client/components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
	GenericTableCell,
} from '../../../../client/components/GenericTable';
import { usePagination } from '../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../client/components/GenericTable/hooks/useSort';
import UserAvatar from '../../../../client/components/avatar/UserAvatar';
import { useForm } from '../../../../client/hooks/useForm';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import CannedResponseFilter from './CannedResponseFilter';
import RemoveCannedResponseButton from './RemoveCannedResponseButton';

type CannedResponseFilterValues = {
	sharing: string;
	createdBy: string;
	tags: Array<{ value: string; label: string }>;
	text: string;
	firstMessage: string;
};

type Scope = 'global' | 'department' | 'user';

const CannedResponsesTable = () => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const getTime = useFormatDateAndTime();

	const isMonitor = usePermission('save-department-canned-responses');
	const isManager = usePermission('save-all-canned-responses');

	const { values, handlers } = useForm({
		sharing: '',
		createdBy: '',
		tags: [],
		text: '',
	});

	const { sharing, createdBy, text } = values as CannedResponseFilterValues;
	const { handleSharing, handleCreatedBy, handleText } = handlers;

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, setSort, sortDirection } = useSort<'shortcut' | 'scope' | 'tags' | '_createdAt' | 'createdBy'>('shortcut');

	const debouncedText = useDebouncedValue(text, 500);

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

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const getCannedResponses = useEndpoint('GET', '/v1/canned-responses');
	const { data, isLoading, isSuccess, refetch } = useQuery(['/v1/canned-responses', query], () => getCannedResponses(query), {
		refetchOnWindowFocus: false,
	});

	const handleAddNew = useMutableCallback(() => router.navigate('/omnichannel/canned-responses/new'));

	const onRowClick = useMutableCallback((id, scope) => (): void => {
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
					sharingValue={sharing}
					createdByValue={createdBy}
					shortcutValue={text}
					setSharing={handleSharing}
					setCreatedBy={handleCreatedBy}
					setShortcut={handleText}
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
					linkHref='https://go.rocket.chat/omnichannel-docs'
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
									{!(scope === 'global' && isMonitor && !isManager) && <RemoveCannedResponseButton _id={_id} reload={refetch} />}
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
