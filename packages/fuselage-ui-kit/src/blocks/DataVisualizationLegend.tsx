import { Box } from '@rocket.chat/fuselage';

type DataVisualizationLegendProps = { names: readonly string[]; colorAt: (index: number) => string };

const DataVisualizationLegend = ({ names, colorAt }: DataVisualizationLegendProps) => (
	// Not ul/li: message bodies prefix every `ul li` with a bullet.
	<Box role='list' display='flex' flexWrap='wrap' columnGap='x16' rowGap='x4' fontScale='c1' color='annotation'>
		{names.map((name, index) => (
			<Box role='listitem' key={index} display='flex' alignItems='center' gap='x4'>
				<Box is='span' width='x12' height='x12' borderRadius='full' style={{ backgroundColor: colorAt(index) }} />
				{name}
			</Box>
		))}
	</Box>
);

export default DataVisualizationLegend;
