import React, { useEffect, useState, useMemo } from 'react';
import { Table } from '@rocket.chat/fuselage';

import { useMethodData, AsyncState } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';

const style = { width: '100%' };

const AgentOverview = ({ type, dateRange, departmentId }) => {
	const t = useTranslation();
	const { start, end } = dateRange;

	const params = useMemo(() => [{
		chartOptions: { name: type },
		daterange: { from: start, to: end },
		...departmentId && { departmentId },
	}], [departmentId, end, start, type]);

	const [data, state] = useMethodData('livechat:getAgentOverviewData', params);

	const [displayData, setDisplayData] = useState();

	useEffect(() => {
		if (state === AsyncState.DONE) {
			setDisplayData(data);
		}
	}, [data, state]);

	return <Table style={style} fixed>
		<Table.Head>
			<Table.Row>
				{displayData?.head?.map(({ name }, i) => <Table.Cell key={i}>{ t(name) }</Table.Cell>)}
			</Table.Row>
		</Table.Head>
		<Table.Body>
			{displayData?.data?.map(({ name, value }, i) => <Table.Row key={i}>
				<Table.Cell>{name}</Table.Cell>
				<Table.Cell>{value}</Table.Cell>
			</Table.Row>)}
		</Table.Body>
	</Table>;
};

export default AgentOverview;
