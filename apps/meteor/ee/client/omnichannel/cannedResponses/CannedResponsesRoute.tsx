import { Table, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRouteParameter, useRoute, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState, FC, ReactElement } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import PageSkeleton from '../../../../client/components/PageSkeleton';
import UserAvatar from '../../../../client/components/avatar/UserAvatar';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useForm } from '../../../../client/hooks/useForm';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { AsyncStatePhase } from '../../../../client/lib/asyncState';
import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import CannedResponseEditWithData from './CannedResponseEditWithData';
import CannedResponseFilter from './CannedResponseFilter';
import CannedResponseNew from './CannedResponseNew';
import CannedResponsesPage from './CannedResponsesPage';
import RemoveCannedResponseButton from './RemoveCannedResponseButton';

const CannedResponsesRoute: FC = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');
	const isMonitor = usePermission('save-department-canned-responses');
	const isManager = usePermission('save-all-canned-responses');

	type CannedResponseFilterValues = {
		sharing: string;
		createdBy: string;
		tags: Array<{ value: string; label: string }>;
		text: string;
		firstMessage: string;
	};

	type Scope = 'global' | 'department' | 'user';

	const { values, handlers } = useForm({
		sharing: '',
		createdBy: '',
		tags: [],
		text: '',
	});

	const { sharing, createdBy, text } = values as CannedResponseFilterValues;
	const { handleSharing, handleCreatedBy, handleText } = handlers;

	const [params, setParams] = useState<{ current?: number; itemsPerPage?: 25 | 50 | 100 }>({
		current: 0,
		itemsPerPage: 25,
	});
	const [sort, setSort] = useState<[string, 'asc' | 'desc' | undefined]>(['shortcut', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const debouncedText = useDebouncedValue(text, 500);

	const query = useMemo(
		() => ({
			text: debouncedText,
			sort: JSON.stringify({ [debouncedSort[0]]: debouncedSort[1] === 'asc' ? 1 : -1 }),
			...(sharing && { scope: sharing }),
			...(createdBy && createdBy !== 'all' && { createdBy }),
			...(debouncedParams.itemsPerPage && { count: debouncedParams.itemsPerPage }),
			...(debouncedParams.current && { offset: debouncedParams.current }),
		}),
		[createdBy, debouncedParams, debouncedSort, debouncedText, sharing],
	);

	const cannedResponsesRoute = useRoute('omnichannel-canned-responses');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((id, scope) => (): void => {
		if (scope === 'global' && isMonitor && !isManager) {
			dispatchToastMessage({
				type: 'error',
				message: t('Not_authorized'),
			});
			return;
		}
		cannedResponsesRoute.push({
			context: 'edit',
			id,
		});
	});

	const defaultOptions = useMemo(
		() => ({
			global: t('Public'),
			department: t('Department'),
			user: t('Private'),
		}),
		[t],
	);

	const { value: data, reload } = useEndpointData('canned-responses', query);
	const { value: totalData, phase: totalDataPhase, reload: totalDataReload } = useEndpointData('canned-responses');

	const getTime = useFormatDateAndTime();

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'shortcut'}
					direction={sort[1]}
					active={sort[0] === 'shortcut'}
					onClick={onHeaderClick}
					sort='shortcut'
				>
					{t('Shortcut')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'sharing'} direction={sort[1]} active={sort[0] === 'sharing'} onClick={onHeaderClick} sort='sharing'>
					{t('Sharing')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'createdBy'}
					direction={sort[1]}
					active={sort[0] === 'createdBy'}
					onClick={onHeaderClick}
					sort='createdBy'
				>
					{t('Created_by')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'createdAt'}
					direction={sort[1]}
					active={sort[0] === 'createdAt'}
					onClick={onHeaderClick}
					sort='createdAt'
				>
					{t('Created_at')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'tags'} direction={sort[1]} active={sort[0] === 'tags'} onClick={onHeaderClick} sort='tags'>
					{t('Tags')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, shortcut, scope, createdBy, _createdAt, tags = [] }): ReactElement => (
			<Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id, scope)} action qa-user-id={_id}>
				<Table.Cell withTruncatedText>{shortcut}</Table.Cell>
				<Table.Cell withTruncatedText>{defaultOptions[scope as Scope]}</Table.Cell>
				<Table.Cell withTruncatedText>
					<Box display='flex' alignItems='center'>
						<UserAvatar size='x24' username={createdBy.username} />
						<Box display='flex' withTruncatedText mi='x8'>
							<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
								<Box fontScale='p2m' withTruncatedText color='default'>
									{createdBy.username}
								</Box>
							</Box>
						</Box>
					</Box>
				</Table.Cell>
				<Table.Cell withTruncatedText>{getTime(_createdAt)}</Table.Cell>
				<Table.Cell withTruncatedText>{tags.join(', ')}</Table.Cell>
				{!(scope === 'global' && isMonitor && !isManager) && (
					<RemoveCannedResponseButton _id={_id} reload={reload} totalDataReload={totalDataReload} />
				)}
			</Table.Row>
		),
		[getTime, onRowClick, reload, totalDataReload, defaultOptions, isMonitor, isManager],
	);

	if (context === 'edit' && id) {
		return <CannedResponseEditWithData reload={reload} totalDataReload={totalDataReload} cannedResponseId={id} />;
	}

	if (context === 'new') {
		return <CannedResponseNew reload={reload} totalDataReload={totalDataReload} />;
	}

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	if (totalDataPhase === AsyncStatePhase.LOADING) {
		return <PageSkeleton></PageSkeleton>;
	}

	return (
		<CannedResponsesPage
			setParams={setParams}
			renderFilter={(): ReactElement => (
				<CannedResponseFilter
					sharingValue={sharing}
					createdByValue={createdBy}
					shortcutValue={text}
					setSharing={handleSharing}
					setCreatedBy={handleCreatedBy}
					setShortcut={handleText}
				/>
			)}
			params={params}
			data={data}
			header={header}
			renderRow={renderRow}
			title={t('Canned_Responses')}
			totalCannedResponses={totalData?.total || 0}
		></CannedResponsesPage>
	);
};

export default CannedResponsesRoute;
