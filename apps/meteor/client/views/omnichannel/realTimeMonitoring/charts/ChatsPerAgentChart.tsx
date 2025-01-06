import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'line'> | undefined, t: TFunction) =>
	drawLineChart(canvas, context, [t('Open'), t('Closed'), t('On_Hold_Chats')], [], [[], []], {
		legends: true,
		anim: true,
		smallTicks: true,
	});

type ChatsPerAgentChartProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/chats-per-agent'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ChatsPerAgentChart = ({ params, reloadRef, ...props }: ChatsPerAgentChartProps) => {
	const { t } = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<chartjs.Chart<'line'>>();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const {
		value: data = {},
		phase: state,
		reload,
	} = useEndpointData('/v1/livechat/analytics/dashboards/charts/chats-per-agent', { params });

	reloadRef.current.chatsPerAgentChart = reload;

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
		if (state === AsyncStatePhase.RESOLVED) {
			Object.entries(data).forEach(([name, value]) => {
				if (name === 'success') {
					return;
				}

				updateChartData(name, [value.open, value.closed, value.onhold]);
			});
		}
	}, [data, state, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsPerAgentChart;
