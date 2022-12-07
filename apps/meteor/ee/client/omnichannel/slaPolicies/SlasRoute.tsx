import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, usePermission, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../../client/components/GenericTable';
import type { GenericTableParams } from '../../../../client/components/GenericTable/GenericTable';
import VerticalBar from '../../../../client/components/VerticalBar';
import NotAuthorizedPage from '../../../../client/views/notAuthorized/NotAuthorizedPage';
import RemoveSlaButton from './RemoveSlaButton';
import SlaEditWithData from './SlaEditWithData';
import SlaNew from './SlaNew';
import SlasPage from './SlasPage';

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

const useEndpointQuery = (
	{ text, itemsPerPage, current }: GenericTableParams,
	[column, direction]: [string, 'asc' | 'desc'],
): {
	sort: string;
	count?: number;
	current?: number;
} =>
	useMemo(
		() => ({
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

function SlasRoute(): ReactElement {
	const t = useTranslation();
	const canViewSlas = usePermission('manage-livechat-sla');

	const [params, setParams] = useState<GenericTableParams>({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState<[string, 'asc' | 'desc']>(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useEndpointQuery(debouncedParams, debouncedSort);
	const SlasRoute = useRoute('omnichannel-sla-policies');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id') || '';

	const onHeaderClick = useMutableCallback((id: string) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}

		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback(
		(id) => () =>
			SlasRoute.push({
				context: 'edit',
				id,
			}),
	);

	const getSlaData = useEndpoint('GET', '/v1/livechat/sla');
	const { data, refetch } = useQuery(['/v1/livechat/sla', query], () => getSlaData(query));

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
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
					{t('Estimated_wait_time')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, name, description, dueTimeInMinutes }) => (
			<Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
				<Table.Cell withTruncatedText>{name}</Table.Cell>
				<Table.Cell withTruncatedText>{description}</Table.Cell>
				<Table.Cell withTruncatedText>
					{dueTimeInMinutes} {t('minutes')}
				</Table.Cell>
				<RemoveSlaButton _id={_id} reload={refetch} />
			</Table.Row>
		),
		[refetch, onRowClick, t],
	);

	const EditSlasTab = useCallback((): ReactElement | null => {
		if (!context) {
			return null;
		}

		const handleVerticalBarCloseButtonClick = (): void => {
			SlasRoute.push({});
		};

		return (
			<VerticalBar>
				<VerticalBar.Header>
					{context === 'edit' && t('Edit_SLA_Policy')}
					{context === 'new' && t('New_SLA_Policy')}
					<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
				</VerticalBar.Header>

				{context === 'edit' && <SlaEditWithData slaId={id || ''} reload={refetch} />}
				{context === 'new' && <SlaNew reload={refetch} />}
			</VerticalBar>
		);
	}, [t, context, id, SlasRoute, refetch]);

	if (!canViewSlas) {
		return <NotAuthorizedPage />;
	}

	return (
		<SlasPage setParams={setParams} params={params} data={data} header={header} renderRow={renderRow} title={t('SLA_Policies')}>
			<EditSlasTab />
		</SlasPage>
	);
}

export default SlasRoute;
