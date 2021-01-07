import { Button, Table, Icon } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback, useState } from 'react';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpointData } from '../../../hooks/useEndpointData';

export function SendTestButton() {
	const t = useTranslation();

	return <Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Button small ghost title={t('Send_Test_Email')} >
			<Icon name='send' size='x20'/>
		</Button>
	</Table.Cell>;
}

// const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const useQuery = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [column, current, direction, itemsPerPage]);

function EmailChannelTable() {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort] = useState(['name', 'asc']);
	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const router = useRoute('admin-email-channel');

	const onClick = useCallback((_id) => () => router.push({
		context: 'edit',
		_id,
	}), [router]);


	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'}>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'email'} direction={sort[1]} active={sort[0] === 'email'}>{t('Email')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'_createdBy'} direction={sort[1]} active={sort[0] === '_createdBy'}>{t('Created_by')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'sendTest'} w='x60'></GenericTable.HeaderCell>,
	].filter(Boolean), [sort, t]);

	const { value: data } = useEndpointData('email-channel.list', query);

	const renderRow = useCallback(({ _id, name, email, _createdBy: { username: createdBy } }) => <Table.Row action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link'qa-room-id={_id}>
		<Table.Cell withTruncatedText>{name}</Table.Cell>
		<Table.Cell withTruncatedText>{email}</Table.Cell>
		<Table.Cell withTruncatedText>{createdBy}</Table.Cell>
		<SendTestButton />
	</Table.Row>, [onClick]);

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data && data.emailChannels}
		total={data && data.total}
		setParams={setParams}
		params={params}
	/>;
}

export default EmailChannelTable;
