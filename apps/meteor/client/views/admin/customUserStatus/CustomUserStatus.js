import { Table } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import MarkdownText from '../../../components/MarkdownText';
import { useTranslation } from '../../../contexts/TranslationContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function CustomUserStatus({ data, sort, onClick, onHeaderClick, setParams, params }) {
	const t = useTranslation();

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key='presence'
					direction={sort[1]}
					active={sort[0] === 'statusType'}
					onClick={onHeaderClick}
					sort='statusType'
				>
					{t('Presence')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[onHeaderClick, sort, t],
	);

	const renderRow = (status) => {
		const { _id, name, statusType } = status;
		return (
			<Table.Row key={_id} onKeyDown={onClick(_id, status)} onClick={onClick(_id, status)} tabIndex={0} role='link' action qa-user-id={_id}>
				<Table.Cell fontScale='p2' color='default' style={style}>
					<MarkdownText content={name} parseEmoji={true} variant='inline' />
				</Table.Cell>
				<Table.Cell fontScale='p2' color='default' style={style}>
					{statusType}
				</Table.Cell>
			</Table.Row>
		);
	};

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.statuses ?? []}
			total={data?.total ?? 0}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
		/>
	);
}

export default CustomUserStatus;
