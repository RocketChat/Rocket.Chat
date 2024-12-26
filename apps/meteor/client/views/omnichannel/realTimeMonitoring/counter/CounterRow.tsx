import { Box, Divider } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Fragment } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

type CounterRowProps = {
	children?: ReactNode[];
} & ComponentPropsWithoutRef<typeof Box>;

const CounterRow = ({ children, ...props }: CounterRowProps) => (
	<Box pb={28} pi={20} display='flex' flexDirection='row' justifyContent='space-around' alignItems='center' flexGrow={1} {...props}>
		{children &&
			flattenChildren(children).reduce(
				(acc, child, i) =>
					children.length - 1 !== i
						? [
								...acc,
								<Fragment key={i}>{child}</Fragment>,
								<Divider key={(i + 1) * children.length} width='x2' m='none' alignSelf='stretch' />,
							]
						: [...acc, child],
				[] as ReactNode[],
			)}
	</Box>
);

export default CounterRow;
