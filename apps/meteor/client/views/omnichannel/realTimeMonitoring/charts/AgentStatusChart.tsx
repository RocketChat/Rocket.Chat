import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint, type TranslationKey } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

const labels = ['Available', 'Away', 'Busy', 'Offline'];

const initialData = {
	available: 0,
	away: 0,
	busy: 0,
	offline: 0,
};

const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'doughnut'> | undefined, t: TFunction) =>
	drawDoughnutChart(
		canvas,
		t('Agents'),
		context,
		labels.map((l) => t(l as TranslationKey)),
		Object.values(initialData),
	);

type AgentStatusChartsProps = {
	departmentId: ILivechatDepartment['_id'];
} & ComponentPropsWithoutRef<typeof Box>;

const AgentStatusChart = ({ departmentId, ...props }: AgentStatusChartsProps) => {
	const { t } = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<chartjs.Chart<'doughnut'> | undefined> = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const getAgentStatus = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/agents-status');
	const { isSuccess, data: { offline = 0, available = 0, away = 0, busy = 0 } = initialData } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.agentsStatus(departmentId),
		queryFn: () => getAgentStatus({ departmentId }),
	});

	useEffect(() => {
		const initChart = async () => {
			if (!canvas.current) {
				return;
			}

			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (!isSuccess) return;

		updateChartData(t('Offline'), [offline]);
		updateChartData(t('Available'), [available]);
		updateChartData(t('Away'), [away]);
		updateChartData(t('Busy'), [busy]);
	}, [available, away, busy, offline, isSuccess, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default AgentStatusChart;
