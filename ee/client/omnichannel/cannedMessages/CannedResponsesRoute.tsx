import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import NotAuthorizedPage from '../../../../client/components/NotAuthorizedPage';
import VerticalBar from '../../../../client/components/VerticalBar';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import { useRouteParameter, useRoute } from '../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import CannedResponsesPage from './CannedResponsesPage';
import RemoveCannedResponseButton from './RemoveCannedResponseButton';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			fields: JSON.stringify({ name: 1 }),
			text,
			sort: JSON.stringify({
				[column]: sortDir(direction),
				usernames: column === 'name' ? sortDir(direction) : undefined,
			}),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, itemsPerPage, current, column, direction],
	);

function CannedResponsesRoute() {
	const t = useTranslation();
	const canViewCannedResponses = usePermission('manage-livechat-canned-responses');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const cannedResponsesRoute = useRoute('omnichannel-units');
	const context = useRouteParameter('context');
	// const id = useRouteParameter('id');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((id) => () =>
		cannedResponsesRoute.push({
			context: 'edit',
			id,
		}),
	);

	const { value: data = {}, reload } = useEndpointData('livechat/units.list', query);

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
				<GenericTable.HeaderCell
					key={'sharing'}
					direction={sort[1]}
					active={sort[0] === 'sharing'}
					onClick={onHeaderClick}
					sort='sharing'
				>
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
				<GenericTable.HeaderCell
					key={'tags'}
					direction={sort[1]}
					active={sort[0] === 'tags'}
					onClick={onHeaderClick}
					sort='tags'
				>
					{t('Tags')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, shortcut, scope, createdBy, createdAt, tags }) => (
			<Table.Row
				key={_id}
				tabIndex={0}
				role='link'
				onClick={onRowClick(_id)}
				action
				qa-user-id={_id}
			>
				<Table.Cell withTruncatedText>{shortcut}</Table.Cell>
				<Table.Cell withTruncatedText>{scope}</Table.Cell>
				<Table.Cell withTruncatedText>{createdBy}</Table.Cell>
				<Table.Cell withTruncatedText>{createdAt}</Table.Cell>
				<Table.Cell withTruncatedText>{tags}</Table.Cell>
				<RemoveCannedResponseButton _id={_id} reload={reload} />
			</Table.Row>
		),
		[reload, onRowClick],
	);

	const EditCannedResponsesTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			cannedResponsesRoute.push({});
		};

		return (
			<VerticalBar>
				<VerticalBar.Header>
					{context === 'edit' && t('Edit_CannedResponse')}
					{context === 'new' && t('New_CannedResponse')}
					<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
				</VerticalBar.Header>
			</VerticalBar>
			// {context === 'edit' && <CannedResponsesEditWithData cannedResponseId={id} reload={reload} />}
			// {context === 'new' && <CannedResponsesNew reload={reload} />}
		);
	}, [t, context, cannedResponsesRoute]);

	if (!canViewCannedResponses) {
		return <NotAuthorizedPage />;
	}

	return (
		<CannedResponsesPage
			setParams={setParams}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			useQuery={useQuery}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Canned_Responses')}
		>
			<EditCannedResponsesTab />
		</CannedResponsesPage>
	);
}

export default CannedResponsesRoute;
