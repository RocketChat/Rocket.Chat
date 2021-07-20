import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import CustomFieldsPage from './CustomFieldsPage';
import EditCustomFieldsPage from './EditCustomFieldsPageContainer';
import NewCustomFieldsPage from './NewCustomFieldsPage';
import RemoveCustomFieldButton from './RemoveCustomFieldButton';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			fields: JSON.stringify({ label: 1 }),
			text,
			sort: JSON.stringify({ [column]: sortDir(direction) }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, itemsPerPage, current, column, direction],
	);

const CustomFieldsRoute = () => {
	const t = useTranslation();
	const canViewCustomFields = usePermission('view-livechat-customfields');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['field', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const departmentsRoute = useRoute('omnichannel-customfields');
	const context = useRouteParameter('context');

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

	const { value: data, reload } = useEndpointData('livechat/custom-fields', query);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'field'}
					direction={sort[1]}
					active={sort[0] === '_id'}
					onClick={onHeaderClick}
					sort='_id'
				>
					{t('Field')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'label'}
					direction={sort[1]}
					active={sort[0] === 'label'}
					onClick={onHeaderClick}
					sort='label'
				>
					{t('Label')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'scope'}
					direction={sort[1]}
					active={sort[0] === 'scope'}
					onClick={onHeaderClick}
					sort='scope'
				>
					{t('Scope')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'visibility'}
					direction={sort[1]}
					active={sort[0] === 'visibility'}
					onClick={onHeaderClick}
					sort='visibility'
				>
					{t('Visibility')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ label, _id, scope, visibility }) => (
			<Table.Row
				key={_id}
				tabIndex={0}
				role='link'
				onClick={onRowClick(_id)}
				action
				qa-user-id={_id}
			>
				<Table.Cell withTruncatedText>{_id}</Table.Cell>
				<Table.Cell withTruncatedText>{label}</Table.Cell>
				<Table.Cell withTruncatedText>{scope === 'visitor' ? t('Visitor') : t('Room')}</Table.Cell>
				<Table.Cell withTruncatedText>
					{visibility === 'visible' ? t('Visible') : t('Hidden')}
				</Table.Cell>
				<RemoveCustomFieldButton _id={_id} reload={reload} />
			</Table.Row>
		),
		[onRowClick, reload, t],
	);

	if (!canViewCustomFields) {
		return <NotAuthorizedPage />;
	}

	if (context === 'new') {
		return <NewCustomFieldsPage reload={reload} />;
	}

	if (context === 'edit') {
		return <EditCustomFieldsPage reload={reload} />;
	}

	return (
		<CustomFieldsPage
			setParams={setParams}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			useQuery={useQuery}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Custom_Fields')}
		/>
	);
};

export default CustomFieldsRoute;
