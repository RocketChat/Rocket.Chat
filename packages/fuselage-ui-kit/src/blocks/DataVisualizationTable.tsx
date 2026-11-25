import { useTranslation } from 'react-i18next';

import type { ChartModel } from '../utils/dataVisualization';

const DataVisualizationTable = ({ title, model }: { title: string; model: ChartModel }) => {
	const { t } = useTranslation();

	if (model.kind === 'pie') {
		return (
			<table>
				<caption>{title}</caption>
				<thead>
					<tr>
						<th scope='col'>{t('Label')}</th>
						<th scope='col'>{t('Value')}</th>
					</tr>
				</thead>
				<tbody>
					{model.slices.map(({ label, value }, index) => (
						<tr key={index}>
							<th scope='row'>{label}</th>
							<td>{value}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<table>
			<caption>{title}</caption>
			<thead>
				<tr>
					<th scope='col'>{t('Category')}</th>
					{model.series.map(({ name }, index) => (
						<th key={index} scope='col'>
							{name}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{model.categories.map((category, row) => (
					<tr key={row}>
						<th scope='row'>{category}</th>
						{model.series.map(({ values }, index) => (
							<td key={index}>{values[row]}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default DataVisualizationTable;
