import { Box, Table } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute } from '../../../contexts/RouterContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function EmailChannelTable() {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort] = useState(['name', 'asc']);

	const routeName = 'admin-rooms';

	const router = useRoute(routeName);

	const onClick = useCallback((rid) => () => router.push({
		context: 'edit',
		id: rid,
	}), [router]);


	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} w='x200'>{t('Name')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, t]);

	const renderRow = useCallback(({ _id, name }) => <Table.Row action key={_id} onKeyDown={onClick(_id)} onClick={onClick(_id)} tabIndex={0} role='link'qa-room-id={_id}>
		<Table.Cell style={style}>
			<Box display='flex' alignContent='center'>
				{name}
			</Box>
		</Table.Cell>
	</Table.Row>, [onClick]);

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={[]}
		total={0}
		setParams={setParams}
		params={params}
	/>;
}

export default EmailChannelTable;
