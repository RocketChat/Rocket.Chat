import { Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();
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
			<TableHead>
				<TableRow>{displayData.head?.map(({ name }, i) => <TableCell key={i}>{t(name as TranslationKey)}</TableCell>)}</TableRow>
			</TableHead>
			<TableBody>
				{displayData.data?.map(({ name, value }, i) => (
					<TableRow key={i}>
						<TableCell>{name}</TableCell>
						<TableCell>{value}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export default AgentOverview;
