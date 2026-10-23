import { Box, type BoxProps } from '../../Box';

export type TableSelectionProps = BoxProps & {
	text?: string;
};

const TableSelection = ({ children, text, ...props }: TableSelectionProps) => (
	<Box rcx-table__selection display='flex' alignItems='center' justifyContent='space-between' paddingInline={24} elevation='2' {...props}>
		<Box fontScale='p2b' marginBlock={16} flexShrink={1} withTruncatedText>
			{text}
		</Box>
		{children && (
			<Box marginInline='neg-x8' fontScale='p2m' flexShrink={0}>
				{children}
			</Box>
		)}
	</Box>
);

export default TableSelection;
