import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { updateChart } from '../../../../../app/livechat/client/lib/chartHandler';

export const useUpdateChartData = ({ context, canvas, init, t }) =>
	useMutableCallback(async (label, data) => {
		if (!context.current) {
			context.current = await init(canvas.current, context.current, t);
		}
		await updateChart(context.current, label, data);
	});
