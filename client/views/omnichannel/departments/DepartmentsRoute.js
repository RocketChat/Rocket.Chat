import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import DepartmentsPage from './DepartmentsPage';
import EditDepartmentWithData from './EditDepartmentWithData';
import RemoveDepartmentButton from './RemoveDepartmentButton';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], onlyMyDepartments) =>
	useMemo(
		() => ({
			fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
			text,
			sort: JSON.stringify({
				[column]: sortDir(direction),
				usernames: column === 'name' ? sortDir(direction) : undefined,
			}),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
			onlyMyDepartments,
		}),
		[text, itemsPerPage, current, column, direction, onlyMyDepartments],
	);

function DepartmentsRoute() {
	const t = useTranslation();
	const canViewDepartments = usePermission('manage-livechat-departments');
	const canRemoveDepartments = usePermission('remove-livechat-department');

	const [params, setParams] = useState({
		text: '',
		current: 0,
		itemsPerPage: 25,
	});
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const onlyMyDepartments = true;
	const query = useQuery(debouncedParams, debouncedSort, onlyMyDepartments);
	const departmentsRoute = useRoute('omnichannel-departments');
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
			departmentsRoute.push({
				context: 'edit',
				id,
			}),
	);

	const { value: data = {}, reload } = useEndpointData('livechat/department', query);

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
					key={'numAgents'}
					direction={sort[1]}
					active={sort[0] === 'numAgents'}
					onClick={onHeaderClick}
					sort='numAgents'
				>
					{t('Num_Agents')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'enabled'}
					direction={sort[1]}
					active={sort[0] === 'enabled'}
					onClick={onHeaderClick}
					sort='enabled'
				>
					{t('Enabled')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'showOnRegistration'}
					direction={sort[1]}
					active={sort[0] === 'showOnRegistration'}
					onClick={onHeaderClick}
					sort='status'
				>
					{t('Show_on_registration_page')}
				</GenericTable.HeaderCell>,
				canRemoveDepartments && (
					<GenericTable.HeaderCell key={'remove'} w='x60'>
						{t('Remove')}
					</GenericTable.HeaderCell>
				),
			].filter(Boolean),
		[sort, onHeaderClick, t, canRemoveDepartments],
	);

	const renderRow = useCallback(
		({ name, _id, description, numAgents, enabled, showOnRegistration }) => (
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
				<Table.Cell withTruncatedText>{numAgents || '0'}</Table.Cell>
				<Table.Cell withTruncatedText>{enabled ? t('Yes') : t('No')}</Table.Cell>
				<Table.Cell withTruncatedText>{showOnRegistration ? t('Yes') : t('No')}</Table.Cell>
				{canRemoveDepartments && <RemoveDepartmentButton _id={_id} reload={reload} />}
			</Table.Row>
		),
		[canRemoveDepartments, onRowClick, t, reload],
	);

	if (!canViewDepartments) {
		return <NotAuthorizedPage />;
	}

	if (context === 'edit' || context === 'new') {
		return (
			<EditDepartmentWithData
				reload={reload}
				id={id}
				title={context === 'edit' ? t('Edit_Department') : t('New_Department')}
			/>
		);
	}

	return (
		<DepartmentsPage
			setParams={setParams}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			useQuery={useQuery}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Departments')}
		></DepartmentsPage>
	);
}

export default DepartmentsRoute;
