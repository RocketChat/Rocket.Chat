import React, { useMemo } from 'react';
import { Table } from '@rocket.chat/fuselage';

import { GenericTable, Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import FilterByText from './FilterByText';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function CustomUserStatus({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		<Th key={'presence'} direction={sort[1]} active={sort[0] === 'statusType'} onClick={onHeaderClick} sort='statusType'>{t('Presence')}</Th>,
	].filter(Boolean), [onHeaderClick, sort, t]);

	const renderRow = (status) => {
		const { _id, name, statusType } = status;
		return <Table.Row key={_id} onKeyDown={onClick(_id, status)} onClick={onClick(_id, status)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default' style={style}>{name}</Table.Cell>
			<Table.Cell fontScale='p1' color='default' style={style}>{statusType}</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.statuses} total={data.total} setParams={setParams} params={params} />;
}

export default CustomUserStatus;
