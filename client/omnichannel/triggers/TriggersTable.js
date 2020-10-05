import { Table, Callout, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, memo, useMemo } from 'react';

import GenericTable from '../../components/GenericTable';
import DeleteWarningModal from '../../components/DeleteWarningModal';
import { useRoute } from '../../contexts/RouterContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useMethod } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';

const TriggersRow = memo(function TriggersRow(props) {
	const {
		_id,
		name,
		description,
		enabled,
		onDelete,
	} = props;

	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const setModal = useSetModal();

	const bhRoute = useRoute('omnichannel-triggers');

	const deleteTrigger = useMethod('livechat:removeTrigger');

	const handleClick = useMutableCallback(() => {
		bhRoute.push({
			context: 'edit',
			id: _id,
		});
	});

	const handleKeyDown = useMutableCallback((e) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteTrigger = async () => {
			try {
				await deleteTrigger(_id);
				dispatchToastMessage({ type: 'success', message: t('Trigger_removed') });
				onDelete();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteTrigger} onCancel={() => setModal()}/>);
	});

	return <Table.Row
		key={_id}
		role='link'
		action
		tabIndex={0}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
	>
		<Table.Cell withTruncatedText>
			{name}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{description}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{enabled ? t('Yes') : t('No')}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16'/>
			</Button>
		</Table.Cell>
	</Table.Row>;
});

const TriggersTableContainer = ({ reloadRef }) => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25 }));

	const {
		current,
		itemsPerPage,
	} = params;

	const { data, state, reload } = useEndpointDataExperimental('livechat/triggers', useMemo(() => ({ offset: current, count: itemsPerPage }), [current, itemsPerPage]));

	reloadRef.current = reload;

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <TriggersTable
		triggers={data?.triggers}
		totalTriggers={data?.total}
		params={params}
		onChangeParams={setParams}
		onDelete={reload}
	/>;
};

export function TriggersTable({ triggers, totalTriggers, params, onChangeParams, onDelete }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell>
				{t('Name')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Description')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Enabled')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x60'>
				{t('Remove')}
			</GenericTable.HeaderCell>

		</>}
		results={triggers}
		total={totalTriggers}
		params={params}
		setParams={onChangeParams}
	>
		{(props) => <TriggersRow key={props._id} onDelete={onDelete} medium={onMediumBreakpoint} {...props} />}
	</GenericTable>;
}

export default TriggersTableContainer;
