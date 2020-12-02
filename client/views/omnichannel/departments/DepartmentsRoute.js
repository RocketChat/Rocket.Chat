
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Table, Icon, Button } from '@rocket.chat/fuselage';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import DepartmentsPage from './DepartmentsPage';
import EditDepartmentWithData from './DepartmentEdit';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useEndpointData } from '../../../hooks/useEndpointData';

export function RemoveDepartmentButton({ _id, reload }) {
	const deleteAction = useEndpointAction('DELETE', `livechat/department/${ _id }`);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		const result = await deleteAction();
		if (result.success === true) {
			reload();
		}
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Department_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal
			onDelete={onDeleteAgent}
			onCancel={() => setModal()}
		/>);
	});


	return <Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16'/>
		</Button>
	</Table.Cell>;
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

	const { value: data = {}, reload } = useEndpointData('livechat/department', query);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'description'} direction={sort[1]} active={sort[0] === 'description'} onClick={onHeaderClick} sort='description'>{t('Description')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'numAgents'} direction={sort[1]} active={sort[0] === 'numAgents'} onClick={onHeaderClick} sort='numAgents'>{t('Num_Agents')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'enabled'} direction={sort[1]} active={sort[0] === 'enabled'} onClick={onHeaderClick} sort='enabled'>{t('Enabled')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'showOnRegistration'} direction={sort[1]} active={sort[0] === 'showOnRegistration'} onClick={onHeaderClick} sort='status'>{t('Show_on_registration_page')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'remove'} w='x60'>{t('Remove')}</GenericTable.HeaderCell>,
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
		title={t('Departments')}>
	</DepartmentsPage>;
}

export default DepartmentsRoute;
