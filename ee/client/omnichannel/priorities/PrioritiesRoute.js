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
import PrioritiesPage from './PrioritiesPage';
import PriorityEditWithData from './PriorityEditWithData';
import PriorityNew from './PriorityNew';
import RemovePriorityButton from './RemovePriorityButton';

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

function PrioritiesRoute() {
	const t = useTranslation();
	const canViewPriorities = usePermission('manage-livechat-priorities');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const prioritiesRoute = useRoute('omnichannel-priorities');
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

	const onRowClick = useMutableCallback(
		(id) => () =>
			prioritiesRoute.push({
				context: 'edit',
				id,
			}),
	);

	const { value: data = {}, reload } = useEndpointData('livechat/priorities.list', query);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'name'}
					direction={sort[1]}
					active={sort[0] === 'name'}
					onClick={onHeaderClick}
					sort='name'
				>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'description'}
					direction={sort[1]}
					active={sort[0] === 'description'}
					onClick={onHeaderClick}
					sort='description'
				>
					{t('Description')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'dueTimeInMinutes'}
					direction={sort[1]}
					active={sort[0] === 'dueTimeInMinutes'}
					onClick={onHeaderClick}
					sort='dueTimeInMinutes'
				>
					{t('Estimated_due_time')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, name, description, dueTimeInMinutes }) => (
			<Table.Row
				key={_id}
				tabIndex={0}
				role='link'
				onClick={onRowClick(_id)}
				action
				qa-user-id={_id}
			>
				<Table.Cell withTruncatedText>{name}</Table.Cell>
				<Table.Cell withTruncatedText>{description}</Table.Cell>
				<Table.Cell withTruncatedText>
					{dueTimeInMinutes} {t('minutes')}
				</Table.Cell>
				<RemovePriorityButton _id={_id} reload={reload} />
			</Table.Row>
		),
		[reload, onRowClick, t],
	);

	const EditPrioritiesTab = useCallback(() => {
		if (!context) {
			return '';
		}
		const handleVerticalBarCloseButtonClick = () => {
			prioritiesRoute.push({});
		};

		return (
			<VerticalBar>
				<VerticalBar.Header>
					{context === 'edit' && t('Edit_Priority')}
					{context === 'new' && t('New_Priority')}
					<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
				</VerticalBar.Header>

				{context === 'edit' && <PriorityEditWithData priorityId={id} reload={reload} />}
				{context === 'new' && <PriorityNew reload={reload} />}
			</VerticalBar>
		);
	}, [t, context, id, prioritiesRoute, reload]);

	if (!canViewPriorities) {
		return <NotAuthorizedPage />;
	}

	return (
		<PrioritiesPage
			setParams={setParams}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			useQuery={useQuery}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Priorities')}
		>
			<EditPrioritiesTab />
		</PrioritiesPage>
	);
}

export default PrioritiesRoute;
