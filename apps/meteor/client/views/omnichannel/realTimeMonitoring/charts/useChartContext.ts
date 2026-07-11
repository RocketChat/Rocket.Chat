import type { Chart, ChartType } from 'chart.js';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';

type UseChartContextProps<TChart> = {
	canvas: MutableRefObject<HTMLCanvasElement | null>;
	init: (canvas: HTMLCanvasElement, context: TChart | undefined, t: TFunction) => Promise<TChart>;
	t: TFunction;
};

export const useChartContext = <TChartType extends ChartType>({ canvas, init, t }: UseChartContextProps<Chart<TChartType>>) => {
	const [context, setContext] = useState<Chart<TChartType>>();

	useEffect(() => {
		let chart: Chart<TChartType> | undefined;
		let unmounted = false;

		const initializeChart = async () => {
			if (!canvas.current) {
				return;
			}

			chart = await init(canvas.current, undefined, t);

			if (unmounted) {
				chart?.destroy();
				return;
			}

			setContext(chart);
		};

		void initializeChart();

		return () => {
			unmounted = true;
			chart?.destroy();
			setContext(undefined);
		};
	}, [canvas, init, t]);

	return context;
};
