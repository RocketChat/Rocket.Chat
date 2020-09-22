
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Table, Icon } from '@rocket.chat/fuselage';

import { Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import DepartmentsPage from './DepartmentsPage';
import EditDepartmentWithData from './DepartmentEdit';
import { useRouteParameter, useRoute } from '../../contexts/RouterContext';

export function RemoveDepartmentButton({ _id, reload }) {
	const deleteAction = useEndpointAction('DELETE', `livechat/department/${ _id }`);

	const handleRemoveClick = useMutableCallback(async (e) => {
		e.preventDefault();
		e.stopPropagation();
		const result = await deleteAction();
		if (result.success === true) {
			reload();
		}
	});

	return <Table.Cell fontScale='p1' color='hint' onClick={handleRemoveClick} withTruncatedText><Icon name='trash' size='x20'/></Table.Cell>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
	text,
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

function DepartmentsRoute() {
	const t = useTranslation();
	const canViewDepartments = usePermission('manage-livechat-departments');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
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

	const onRowClick = useMutableCallback((id) => () => departmentsRoute.push({
		context: 'edit',
		id,
	}));

	const { data, reload } = useEndpointDataExperimental('livechat/department', query) || {};

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</Th>,
		<Th key={'description'} direction={sort[1]} active={sort[0] === 'description'} onClick={onHeaderClick} sort='description' w='x140'>{t('Description')}</Th>,
		<Th key={'numAgents'} direction={sort[1]} active={sort[0] === 'numAgents'} onClick={onHeaderClick} sort='numAgents' w='x120'>{t('Num_Agents')}</Th>,
		<Th key={'enabled'} direction={sort[1]} active={sort[0] === 'enabled'} onClick={onHeaderClick} sort='enabled' w='x120'>{t('Enabled')}</Th>,
		<Th key={'showOnRegistration'} direction={sort[1]} active={sort[0] === 'showOnRegistration'} onClick={onHeaderClick} sort='status' w='x120'>{t('Show_on_registration_page')}</Th>,
		<Th key={'remove'} w='x40'>{t('Remove')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ name, _id, description, numAgents, enabled, showOnRegistration }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{name}</Table.Cell>
		<Table.Cell withTruncatedText>{description}</Table.Cell>
		<Table.Cell withTruncatedText>{numAgents || '0'}</Table.Cell>
		<Table.Cell withTruncatedText>{enabled ? t('Yes') : t('No')}</Table.Cell>
		<Table.Cell withTruncatedText>{showOnRegistration ? t('Yes') : t('No')}</Table.Cell>
		<RemoveDepartmentButton _id={_id} reload={reload}/>
	</Table.Row>, [onRowClick, t, reload]);

	if (!canViewDepartments) {
		return <NotAuthorizedPage />;
	}

	if (context === 'edit' || context === 'new') {
		return <EditDepartmentWithData
			reload={reload}
			id={id}
			title={context === 'edit' ? t('Edit_Department') : t('New_Department')} />;
	}


	return <DepartmentsPage
		setParams={setParams}
		params={params}
		onHeaderClick={onHeaderClick}
		data={data} useQuery={useQuery}
		reload={reload}
		header={header}
		renderRow={renderRow}
		title={'Departments'}>
	</DepartmentsPage>;
}

export default DepartmentsRoute;
