import { Icon, Table, Button, Callout } from '@rocket.chat/fuselage';
import React, { useState, memo } from 'react';

import GenericTable from '../../components/GenericTable';
import { useRoute } from '../../contexts/RouterContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useResizeInlineBreakpoint } from '../../hooks/useResizeInlineBreakpoint';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';

const CustomFieldsRow = memo(function CustomFieldsRow({
	medium,
	onDelete = () => {},
	...props
}) {
	const {
		_id,
		label,
		scope,
		visibility,
	} = props;

	const t = useTranslation();

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
			<Button small primary danger onClick={onDelete} title={t('Delete')}>
				<Icon name='trash' size='x16'/>
			</Button>
		</Table.Cell>
	</Table.Row>;
});

const CustomFieldsTableContainer = () => {
	const t = useTranslation();
	const [params, setParams] = useState(() => ({ current: 0, itemsPerPage: 25 }));

	const { data, state } = useEndpointDataExperimental(`livechat/custom-fields?count=${ params.itemsPerPage }&offset=${ params.current }`);

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
	/>;
};

export function CustomFieldsTable({ customFields, totalCustomFields, params, onChangeParams }) {
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
		{(props) => <CustomFieldsRow key={props._id} medium={onMediumBreakpoint} {...props} />}
	</GenericTable>;
}

export default CustomFieldsTableContainer;
