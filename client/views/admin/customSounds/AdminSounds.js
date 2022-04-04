import { Box, Table, Icon, Button } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericTable from '../../../components/GenericTable';
import { useCustomSound } from '../../../contexts/CustomSoundContext';
import { useTranslation } from '../../../contexts/TranslationContext';

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

	const customSound = useCustomSound();

	const handlePlay = useCallback(
		(sound) => {
			customSound.play(sound);
		},
		[customSound],
	);

	const renderRow = (sound) => {
		const { _id, name } = sound;

		return (
			<Table.Row key={_id} onKeyDown={onClick(_id, sound)} onClick={onClick(_id, sound)} tabIndex={0} role='link' action qa-user-id={_id}>
				<Table.Cell fontScale='p2' color='default'>
					<Box withTruncatedText>{name}</Box>
				</Table.Cell>
				<Table.Cell alignItems={'end'}>
					<Button ghost small square aria-label={t('Play')} onClick={(e) => e.preventDefault() & e.stopPropagation() & handlePlay(_id)}>
						<Icon name='play' size='x20' />
					</Button>
				</Table.Cell>
			</Table.Row>
		);
	};

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.sounds ?? []}
			total={data?.total ?? 0}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
		/>
	);
}

export default AdminSounds;
