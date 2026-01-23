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
import { useChartContext } from './useChartContext';
import { useUpdateChartData } from './useUpdateChartData';
import { drawLineChart, resetChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'line'> | undefined, t: TFunction) =>
	drawLineChart(canvas, context, [t('Open'), t('Closed'), t('On_Hold_Chats')], [], [[], []], {
		legends: true,
		anim: true,
		smallTicks: true,
	});

type ChatsPerAgentChartProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ChatsPerAgentChart = ({ departmentId, dateRange, ...props }: ChatsPerAgentChartProps) => {
	const { t } = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);

	const getChatsPerAgent = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/chats-per-agent');
	const { isSuccess, data } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.chatsPerAgent(departmentId, dateRange),
		queryFn: () => getChatsPerAgent({ departmentId, ...dateRange }),
		select: ({ success: _, ...data }) => Object.entries(data),
		gcTime: 0,
	});

	const context = useChartContext({
		canvas,
		init,
		t,
	});

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		init,
		t,
	});

	useEffect(() => {
		if (!context) return;

		if (!isSuccess) {
			return;
		}

		resetChart(context);

		data.forEach(([name, value]) => {
			updateChartData(name, [value.open, value.closed, value.onhold]);
		});
	}, [context, data, isSuccess, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsPerAgentChart;
