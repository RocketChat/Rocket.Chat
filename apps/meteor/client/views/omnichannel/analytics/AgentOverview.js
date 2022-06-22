import { Table } from '@rocket.chat/fuselage';
import { useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect, useState } from 'react';

const style = { width: '100%' };

const AgentOverview = ({ type, dateRange, departmentId }) => {
	const t = useTranslation();
	const { start, end } = dateRange;

	const params = useMemo(
		() => ({
			chartOptions: { name: type },
			daterange: { from: start, to: end },
			...(departmentId && { departmentId }),
		}),
		[departmentId, end, start, type],
	);

	const [displayData, setDisplayData] = useState({ head: [], data: [] });

	const loadData = useMethod('livechat:getAgentOverviewData');

	useEffect(() => {
		async function fetchData() {
			if (!start || !end) {
				return;
			}
			const value = await loadData(params);
			setDisplayData(value);
		}
		fetchData();
	}, [start, end, loadData, params]);

	return (
		<Table style={style} fixed>
			<Table.Head>
				<Table.Row>
					{displayData.head?.map(({ name }, i) => (
						<Table.Cell key={i}>{t(name)}</Table.Cell>
					))}
				</Table.Row>
			</Table.Head>
			<Table.Body>
				{displayData.data?.map(({ name, value }, i) => (
					<Table.Row key={i}>
						<Table.Cell>{name}</Table.Cell>
						<Table.Cell>{value}</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
		</Table>
	);
};

export default AgentOverview;
