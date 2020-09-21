import { Icon, Table, Callout, Button } from '@rocket.chat/fuselage';
import React, { useState, memo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';


import GenericTable from '../../components/GenericTable';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import DeleteWarningModal from '../../components/DeleteWarningModal';
import { useSetModal } from '../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';

export function RemoveCustomFieldButton({ _id, reload }) {
	const removeChat = useMethod('livechat:removeCustomField');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeChat(_id);
		} catch (error) {
			console.log(error);
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Custom_Field_Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onDeleteAgent} onCancel={() => setModal()}/>);
	});

	return <Table.Cell fontScale='p1' color='hint' withTruncatedText>
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16'/>
		</Button>
	</Table.Cell>;
}


const CustomFieldsRow = memo(function CustomFieldsRow({
	medium,
	reload,
	...props
}) {
	const {
		_id,
		label,
		scope,
		visibility,
	} = props;


	const cfRoute = useRoute('omnichannel-customfields');

	const handleClick = () => {
		cfRoute.push({
			context: 'edit',
			id: _id,
		});
	};

	const handleKeyDown = (e) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const preventClickPropagation = (e) => {
		e.stopPropagation();
	};

	return <Table.Row
		key={_id}
		role='link'
		action
		tabIndex={0}
		onClick={handleClick}
		onKeyDown={handleKeyDown}
	>
		<Table.Cell withTruncatedText>
			{_id}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{label}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{scope}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{visibility}
		</Table.Cell>
		<Table.Cell withTruncatedText onClick={preventClickPropagation}>
			<RemoveCustomFieldButton _id={_id} reload={reload}/>
		</Table.Cell>
	</Table.Row>;
});

const CustomFieldsTableContainer = () => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25 }));

	const { data, state, reload } = useEndpointDataExperimental(`livechat/custom-fields?count=${ params.itemsPerPage }&offset=${ params.current }`);

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <CustomFieldsTable
		customFields={data?.customFields}
		totalCustomFields={data?.total}
		params={params}
		onChangeParams={setParams}
		reload={reload}
	/>;
};

export function CustomFieldsTable({ customFields, totalCustomFields, params, onChangeParams, reload }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell>
				{t('Field')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Label')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Scope')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Visibility')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x60' />
		</>}
		results={customFields}
		total={totalCustomFields}
		params={params}
		setParams={onChangeParams}
	>
		{(props) => <CustomFieldsRow key={props._id} medium={onMediumBreakpoint} reload={reload} {...props} />}
	</GenericTable>;
}

export default CustomFieldsTableContainer;
