import type { GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../../hooks/useTamaguiBoxProps';
import { Box, type BoxProps } from '../../Box';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { TableSelectionFrame } from '../TableFrames';

export type TableSelectionProps = BoxProps & {
	text?: string;
};

const TableSelection = ({ children, text, ...props }: TableSelectionProps) => {
	const selectionProps = useTamaguiBoxProps({
		'rcx-table__selection': true,
		'display': 'flex',
		'alignItems': 'center',
		'justifyContent': 'space-between',
		'paddingInline': 24,
		'elevation': '2',
		...props,
	});

	return (
		<TableSelectionFrame {...(selectionProps as GetProps<typeof TableSelectionFrame>)}>
			<Box fontScale='p2b' marginBlock={16} flexShrink={1} withTruncatedText>
				{text}
			</Box>
			{children && (
				<Box marginInline='neg-x8' fontScale='p2m' flexShrink={0}>
					{children}
				</Box>
			)}
		</TableSelectionFrame>
	);
};

export default withFuselageProvider(TableSelection, { takesBoxTransforms: true });
