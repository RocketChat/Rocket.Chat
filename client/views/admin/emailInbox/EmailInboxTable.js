import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import SendTestButton from './SendTestButton';

const useQuery = ({ itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage],
	);

function EmailInboxTable() {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort] = useState(['name', 'asc']);
	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const router = useRoute('admin-email-inboxes');

	const onClick = useCallback(
		(_id) => () =>
			router.push({
				context: 'edit',
				_id,
			}),
		[router],
	);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'}>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'email'} direction={sort[1]} active={sort[0] === 'email'}>
					{t('Email')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'active'} direction={sort[1]} active={sort[0] === 'active'}>
					{t('Active')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'sendTest'} w='x60'></GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, t],
	);

	const { value: data } = useEndpointData('email-inbox.list', query);

	const renderRow = useCallback(
		({ _id, name, email, active }) => (
			<Table.Row action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link' qa-room-id={_id}>
				<Table.Cell withTruncatedText>{name}</Table.Cell>
				<Table.Cell withTruncatedText>{email}</Table.Cell>
				<Table.Cell withTruncatedText>{active ? t('Yes') : t('No')}</Table.Cell>
				<SendTestButton id={_id} />
			</Table.Row>
		),
		[onClick, t],
	);

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data && data.emailInboxes}
			total={data && data.total}
			setParams={setParams}
			params={params}
		/>
	);
}

export default EmailInboxTable;
