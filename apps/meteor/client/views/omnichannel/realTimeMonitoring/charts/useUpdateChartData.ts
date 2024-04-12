import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { type Chart } from 'chart.js';
import { type TFunction } from 'i18next';
import { type RefObject } from 'react';

import { updateChart } from '../../../../../app/livechat/client/lib/chartHandler';

type UseUpdateChartDataOptions = {
	context: RefObject<Chart | undefined>;
	canvas: RefObject<HTMLCanvasElement | null>;
	init: (canvas: HTMLCanvasElement, context: undefined, t: TFunction) => Promise<Chart>;
	t: TFunction;
};

export const useUpdateChartData = ({ context: contextRef, canvas: canvasRef, init, t }: UseUpdateChartDataOptions) =>
	useMutableCallback(async (label: string, data: { [x: string]: number }) => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const context = contextRef.current ?? (await init(canvas, undefined, t));

		await updateChart(context, label, data);
	});
