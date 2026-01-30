import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import { type MutableRefObject } from 'react';

import { updateChart } from '../../../../../app/livechat/client/lib/chartHandler';

type UseUpdateChartDataOptions<TChart> = {
	context: TChart | undefined;
	canvas: MutableRefObject<HTMLCanvasElement | null>;
	init: (canvas: HTMLCanvasElement, context: TChart | undefined, t: TFunction) => Promise<TChart>;
	t: TFunction;
};

export function useUpdateChartData<TChartType extends chartjs.ChartType>({
	canvas: canvasRef,
	context,
	init,
	t,
}: UseUpdateChartDataOptions<chartjs.Chart<TChartType>>) {
	return useEffectEvent(async (label: string, data: number[]) => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const chartContext = context ?? (await init(canvas, undefined, t));

		await updateChart(chartContext, label, data);
	});
}
