import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { TranslationContextValue } from '@rocket.chat/ui-contexts';
import { type Chart } from 'chart.js';
import { type MutableRefObject } from 'react';

import { updateChart } from '../../../../../app/livechat/client/lib/chartHandler';

type UseUpdateChartDataOptions = {
	context: MutableRefObject<Chart | undefined>;
	canvas: MutableRefObject<HTMLCanvasElement | null>;
	init: (canvas: HTMLCanvasElement, context: undefined, t: TranslationContextValue['translate']) => Promise<Chart>;
	t: TranslationContextValue['translate'];
};

export const useUpdateChartData = ({ context: contextRef, canvas: canvasRef, init, t }: UseUpdateChartDataOptions) =>
	useMutableCallback(async (label: string, data: number[]) => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const context = contextRef.current ?? (await init(canvas, undefined, t));

		await updateChart(context, label, data);
	});
