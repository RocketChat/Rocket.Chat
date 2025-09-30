import { useQuery } from '@tanstack/react-query';
import type { Chart, ChartType } from 'chart.js';
import type { TFunction } from 'i18next';
import { useRef } from 'react';

type UseChartContextProps<TChart> = {
	key: string;
	canvas: HTMLCanvasElement | null;
	init: (canvas: HTMLCanvasElement, context: TChart | undefined, t: TFunction) => Promise<TChart>;
	t: TFunction;
};

export const useChartContext = <TChartType extends ChartType>({ key, canvas, init, t }: UseChartContextProps<Chart<TChartType>>) => {
	const contextRef = useRef<Chart<TChartType>>();

	const { data: context } = useQuery({
		queryKey: [key, t],
		queryFn: async () => {
			if (!canvas) {
				return;
			}

			contextRef.current = await init(canvas, contextRef.current, t);

			return contextRef.current;
		},
		staleTime: Infinity,
		gcTime: 0,
		refetchOnWindowFocus: false,
		retry: false,
		enabled: !!canvas,
	});

	return context;
};
