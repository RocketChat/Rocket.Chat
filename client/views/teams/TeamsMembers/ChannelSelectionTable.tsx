import React, { FC, useMemo, useState, useCallback } from 'react';
import { Box, Icon, Table, Margins, CheckBox } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';

import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';

type ChannelSelectionTableParams = {
	username: string;
	results: Array<string>;
}

type ChannelRowParams = {
	icon?: string;
	name?: string;
	time: string;
	username: string;
	warning: (username: string) => string;
}

const ChannelRow: FC<ChannelRowParams> = ({ icon, name, time, username, warning }) => {
	const handleChange = (): void => {
		console.log('t e');
	};

	return <Table.Row action>
		<Table.Cell maxWidth='x300' withTruncatedText >
			<CheckBox checked={false} onChange={handleChange} disabled={false} />
			<Margins inline='x8'>
				<Icon size='x16' name={icon} color={colors.n700} />
				{name}
				{warning && <Icon title={warning(username)} size='x16' name='info' color={colors.r600} />}
			</Margins>
		</Table.Cell>

		<Table.Cell align='end' withTruncatedText>
			{time}
		</Table.Cell>
	</Table.Row>;
};

const ChannelSelectionTable: FC<ChannelSelectionTableParams> = ({ username, results }) => {
	const [params, setParams] = useState({ limit: 25, skip: 0 });
	const t = useTranslation();

	const handleParams = useMutableCallback(({ current, itemsPerPage }) => {
		setParams({ skip: current, limit: itemsPerPage });
	});

	const header = useMemo(() => [
		<GenericTable.HeaderCell key='name' sort='name'>
			<CheckBox checked={false} disabled={false} />
			<Box mi='x8'>{t('Channel Name')}</Box>
		</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key='action' sort='action'>
			<Box width='100%' textAlign='end'>{t('Joined At')}</Box>
		</GenericTable.HeaderCell>,
	], [t]);

	return <>
		<Box display='flex' flexDirection='column' height='30vh'>
			<GenericTable
				header={header}
				total={10}
				results={results}
				params={params}
				setParams={handleParams}
				fixed={false}
				pagination={false}
			>
				{useCallback((resultData: any): any => <ChannelRow
					username={username}
					icon={resultData.icon}
					name={resultData.name}
					time={resultData.time}
					warning={resultData.warning}
				/>, [username])}
			</GenericTable>
		</Box>
	</>;
};

export default ChannelSelectionTable;
