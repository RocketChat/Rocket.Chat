import { Table, Box, TextInput, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, memo, useEffect } from 'react';

import GenericTable from '../../../client/components/GenericTable';
import DeleteWarningModal from '../../../client/components/DeleteWarningModal';
import { useSetModal } from '../../../client/contexts/ModalContext';
import { useMethod } from '../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../client/hooks/useResizeInlineBreakpoint';

const FilterByText = memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={useMutableCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

const MonitorsRow = memo(function MonitorsRow(props) {
	const {
		_id,
		name,
		username,
		emails,
		onDelete,
	} = props;

	const setModal = useSetModal();

	const dispatchToastMessage = useToastMessageDispatch();

	const t = useTranslation();

	const removeMonitor = useMethod('livechat:removeMonitor');

	const handleRemove = useMutableCallback(() => {
		const onDeleteMonitor = async () => {
			try {
				await removeMonitor(username);
				dispatchToastMessage({ type: 'success', message: t('Monitor_removed') });
				onDelete();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteMonitor} onCancel={() => setModal()}/>);
	});

	return <Table.Row
		key={_id}
		role='link'
		action
		tabIndex={0}
	>
		<Table.Cell withTruncatedText>
			{name}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{username}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{emails?.find(({ address }) => !!address)?.address}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleRemove}>
				<Icon name='trash' size='x16'/>
			</Button>
		</Table.Cell>
	</Table.Row>;
});

export function MonitorsTable({ monitors, totalMonitors, params, sort, onHeaderClick, onChangeParams, onDelete }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell
				key={'name'}
				sort='name'
				active={sort[0] === 'name'}
				direction={sort[1]}
				onClick={onHeaderClick}
			>
				{t('Name')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Username')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Email')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x60'>{t('Remove')}</GenericTable.HeaderCell>
		</>}
		results={monitors}
		total={totalMonitors}
		params={params}
		setParams={onChangeParams}
		FilterComponent={FilterByText}
	>
		{(props) => <MonitorsRow key={props._id} medium={onMediumBreakpoint} onDelete={onDelete} {...props} />}
	</GenericTable>;
}

export default MonitorsTable;
