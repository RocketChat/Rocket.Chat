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

const FiltersRow = memo(function FiltersRow(props) {
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

	const bhRoute = useRoute('omnichannel-filters');

	const deleteFilter = useMethod('livechat:removeFilter');

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
		const onDeleteFilter = async () => {
			try {
				await deleteFilter(_id);
				dispatchToastMessage({ type: 'success', message: t('Filter_removed') });
				onDelete();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteFilter} onCancel={() => setModal()}/>);
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

const FiltersTableContainer = ({ reloadRef }) => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25 }));

	const {
		current,
		itemsPerPage,
	} = params;

	const { data, state, reload } = useEndpointDataExperimental('livechat/filters', useMemo(() => ({ offset: current, count: itemsPerPage }), [current, itemsPerPage]));

	reloadRef.current = reload;

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <FiltersTable
		filters={data?.filters}
		totalFilters={data?.total}
		params={params}
		onChangeParams={setParams}
		onDelete={reload}
	/>;
};

export function FiltersTable({ filters, totalFilters, params, onChangeParams, onDelete }) {
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
		results={filters}
		total={totalFilters}
		params={params}
		setParams={onChangeParams}
	>
		{(props) => <FiltersRow key={props._id} onDelete={onDelete} medium={onMediumBreakpoint} {...props} />}
	</GenericTable>;
}

export default FiltersTableContainer;
