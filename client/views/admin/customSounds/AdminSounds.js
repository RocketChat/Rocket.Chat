import React, { useMemo } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import SoundRow from './SoundRow';

function AdminSounds({ data, sort, onClick, onHeaderClick, setParams, params }) {
	const t = useTranslation();

	const header = useMemo(
		() => [
			<GenericTable.HeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
				{t('Name')}
			</GenericTable.HeaderCell>,
			<GenericTable.HeaderCell w='x40' key='action' />,
		],
		[onHeaderClick, sort, t],
	);

	return (
		<GenericTable
			header={header}
			renderRow={(sound) => <SoundRow sound={sound} onClick={onClick} />}
			results={data?.sounds ?? []}
			total={data?.total ?? 0}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
		/>
	);
}

export default AdminSounds;
