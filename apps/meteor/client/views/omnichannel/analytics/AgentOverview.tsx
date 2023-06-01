import { Table } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect, useState } from 'react';

const style = { width: '100%' };

const AgentOverview = ({
	type,
	dateRange,
	departmentId,
}: {
	type: string;
	dateRange: { start: string; end: string };
	departmentId: string;
}) => {
	const t = useTranslation();
	const { start, end } = dateRange;

	const params = useMemo(
		() => ({
			name: type,
			from: start,
			to: end,
			...(departmentId && { departmentId }),
		}),
		[departmentId, end, start, type],
	);

	const [displayData, setDisplayData] = useState<{ head: { name: string }[]; data: { name: string; value: number | string }[] }>({
		head: [],
		data: [],
	});

	const loadData = useEndpoint('GET', '/v1/livechat/analytics/agent-overview');

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
						<Table.Cell key={i}>{t(name as TranslationKey)}</Table.Cell>
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
