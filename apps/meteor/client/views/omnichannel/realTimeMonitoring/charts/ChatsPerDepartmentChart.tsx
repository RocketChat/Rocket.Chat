import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'line'> | undefined, t: TFunction) =>
	drawLineChart(canvas, context, [t('Open'), t('Closed')], [], [[], []], {
		legends: true,
		anim: true,
		smallTicks: true,
	});

type ChatsPerDepartmentChartProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ChatsPerDepartmentChart = ({ departmentId, dateRange, ...props }: ChatsPerDepartmentChartProps) => {
	const { t } = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<chartjs.Chart<'line'>>();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const getChatsPerDepartment = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/chats-per-department');
	const { isSuccess, data } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.chatsPerDepartment(departmentId, dateRange),
		queryFn: () => getChatsPerDepartment({ departmentId, ...dateRange }),
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
		Object.entries(data).forEach(([name, value]) => {
			if (name === 'success') {
				return;
			}

			updateChartData(name, [value.open, value.closed]);
		});
	}, [data, isSuccess, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsPerDepartmentChart;
