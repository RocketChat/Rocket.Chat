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

const labels = ['Open', 'Queued', 'On_Hold_Chats', 'Closed'];

const initialData = {
	open: 0,
	queued: 0,
	onhold: 0,
	closed: 0,
};

const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'doughnut'> | undefined, t: TFunction) =>
	drawDoughnutChart(
		canvas,
		t('Chats'),
		context,
		labels.map((l) => t(l as TranslationKey)),
		Object.values(initialData),
	);

type ChatsChartProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ChatsChart = ({ departmentId, dateRange, ...props }: ChatsChartProps) => {
	const { t } = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<chartjs.Chart<'doughnut'> | undefined> = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const getChats = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/chats');
	const { isSuccess, data } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.chats(departmentId, dateRange),
		queryFn: () => getChats({ departmentId, ...dateRange }),
	});

	const { open, queued, closed, onhold } = data ?? initialData;

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

		updateChartData(t('Open'), [open]);
		updateChartData(t('Closed'), [closed]);
		updateChartData(t('On_Hold_Chats'), [onhold]);
		updateChartData(t('Queued'), [queued]);
	}, [closed, open, queued, onhold, isSuccess, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsChart;
