import { Box, Divider } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Fragment } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import type { AnalyticsGridItemProps } from '../AnalyticsLayoutProps';

// Grid layout props (AnalyticsGridItemProps) plus the border/paddingBlock knobs
// the analytics Overview uses to flatten the row. Bounded on purpose.
export type CounterRowProps = {
	children?: ReactNode[];
} & AnalyticsGridItemProps &
	Pick<ComponentPropsWithoutRef<typeof Box>, 'border' | 'paddingBlock'>;

const CounterRow = ({ children, ...props }: CounterRowProps) => (
	<Box
		paddingBlock={28}
		paddingInline={20}
		display='flex'
		flexDirection='row'
		justifyContent='space-around'
		alignItems='center'
		flexGrow={1}
		{...props}
	>
		{children &&
			flattenChildren(children).reduce(
				(acc: ReactNode[], child, i) =>
					children.length - 1 !== i
						? [
								...acc,
								<Fragment key={i}>{child}</Fragment>,
								<Divider key={(i + 1) * children.length} width='x2' margin='none' alignSelf='stretch' />,
							]
						: [...acc, child],
				[],
			)}
	</Box>
);

export default CounterRow;
