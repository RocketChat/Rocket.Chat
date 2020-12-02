import React, { useMemo } from 'react';
import { Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethodData } from '../../../hooks/useMethodData';

const style = { width: '100%' };

const AgentOverview = ({ type, dateRange, departmentId }) => {
	const t = useTranslation();
	const { start, end } = dateRange;

	const params = useMemo(() => [{
		chartOptions: { name: type },
		daterange: { from: start, to: end },
		...departmentId && { departmentId },
	}], [departmentId, end, start, type]);

	const { value: displayData } = useMethodData('livechat:getAgentOverviewData', params);

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
