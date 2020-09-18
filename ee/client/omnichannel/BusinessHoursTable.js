import { Table, Callout, Box, TextInput, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, memo, useMemo, useEffect } from 'react';

import GenericTable from '../../../client/components/GenericTable';
import { useRoute } from '../../../client/contexts/RouterContext';
import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../../client/hooks/useResizeInlineBreakpoint';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../client/hooks/useEndpointDataExperimental';
import DeleteWarningModal from '../../../client/components/DeleteWarningModal';
import { useSetModal } from '../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../client/contexts/ServerContext';


export function RemoveBusinessHourButton({ _id, type, reload }) {
	const removeBusinessHour = useMethod('livechat:removeBusinessHour');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeBusinessHour(_id, type);
		} catch (error) {
			console.log(error);
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onBusinessHour = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Business_Hour_Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal onDelete={onBusinessHour} onCancel={() => setModal()}/>);
	});

	return <Table.Cell fontScale='p1' color='hint' onClick={handleDelete} withTruncatedText>
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16'/>
		</Button>
	</Table.Cell>;
}

const FilterByText = memo(({ setFilter, ...props }) => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={useMutableCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput placeholder={t('Search_Apps')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
});

const BusinessHoursRow = memo(function BusinessHoursRow(props) {
	const {
		_id,
		name,
		timezone,
		workHours,
		active,
		type,
		reload,
	} = props;

	const t = useTranslation();

	const bhRoute = useRoute('omnichannel-businessHours');

	const handleClick = () => {
		bhRoute.push({
			context: 'edit',
			type,
			id: _id,
		});
	};

	const handleKeyDown = (e) => {
		if (!['Enter', 'Space'].includes(e.nativeEvent.code)) {
			return;
		}

		handleClick();
	};

	const openDays = useMemo(() => workHours.reduce((acc, day) => {
		if (day.open) {
			acc.push(t(day.day));
		}
		return acc;
	}, []), [t, workHours]);

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
			{name || t('Default')}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{t(timezone.name)}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{openDays.join(', ')}
		</Table.Cell>
		<Table.Cell withTruncatedText>
			{active ? t('Yes') : t('No')}
		</Table.Cell>
		{name && <Table.Cell withTruncatedText onClick={preventClickPropagation}>
			<RemoveBusinessHourButton _id={_id} reload={reload} type={type}/>
		</Table.Cell>}
	</Table.Row>;
});

const BusinessHoursTableContainer = () => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25, text: '' }));

	const { data, state, reload } = useEndpointDataExperimental(`livechat/business-hours.list?count=${ params.itemsPerPage }&offset=${ params.current }&name=${ params.text }`);

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout>
			{t('Error')}: error
		</Callout>;
	}

	return <BusinessHoursTable
		businessHours={data?.businessHours}
		totalbusinessHours={data?.total}
		params={params}
		onChangeParams={setParams}
		reload={reload}
	/>;
};

export function BusinessHoursTable({ businessHours, totalbusinessHours, params, onChangeParams, reload }) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200);

	return <GenericTable
		ref={ref}
		header={<>
			<GenericTable.HeaderCell>
				{t('Name')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Timezone')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>
				{t('Open_Days')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x100'>
				{t('Enabled')}
			</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x100'>
				{t('Remove')}
			</GenericTable.HeaderCell>
		</>}
		results={businessHours}
		total={totalbusinessHours}
		params={params}
		setParams={onChangeParams}
		FilterComponent={FilterByText}
	>
		{(props) => <BusinessHoursRow key={props._id} medium={onMediumBreakpoint} reload={reload} {...props} />}
	</GenericTable>;
}

export default BusinessHoursTableContainer;
