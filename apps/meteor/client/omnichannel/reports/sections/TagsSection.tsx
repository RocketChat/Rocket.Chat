import { useResizeObserver } from '@rocket.chat/fuselage-hooks';

import { BarChart, ReportCard } from '../components';
import { useTagsSection } from '../hooks';
import { ellipsis } from '../utils/ellipsis';

export const TagsSection = () => {
	const { data, ...config } = useTagsSection();
	const { ref, contentBoxSize: { inlineSize: cardWidth = 200 } = {} } = useResizeObserver<HTMLElement>();
	const width = cardWidth * 0.9;

	return (
		<ReportCard ref={ref} {...config}>
			<BarChart
				data={data}
				direction='horizontal'
				height={360}
				maxWidth={width}
				margins={{ left: 40, top: 40, right: 20 }}
				axis={{
					axisLeft: {
						tickSize: 0,
						tickRotation: 0,
						format: (v) => ellipsis(v, 10),
					},
					axisTop: {
						tickSize: 0,
						tickRotation: 0,
						tickValues: 4,
						format: (v) => ellipsis(v, 10),
					},
				}}
			/>
		</ReportCard>
	);
};
