import React, { useMemo } from 'react';
import { Box, Table } from '@rocket.chat/fuselage';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';

function CustomEmoji({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<GenericTable.HeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x200'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key='aliases' w='x200'>{t('Aliases')}</GenericTable.HeaderCell>,
	], [onHeaderClick, sort, t]);

	const renderRow = (emojis) => {
		const { _id, name, aliases } = emojis;
		return <Table.Row key={_id} onKeyDown={onClick(_id, emojis)} onClick={onClick(_id, emojis)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{name}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{aliases}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data?.emojis ?? []}
		total={data?.total ?? 0}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
	/>;
}

export default CustomEmoji;
