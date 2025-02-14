import type { ComponentPropsWithoutRef } from 'react';
import { forwardRef } from 'react';

import CustomScrollbars from './CustomScrollbars';

type VirtuosoScrollbarsProps = ComponentPropsWithoutRef<typeof CustomScrollbars>;

const VirtuosoScrollbars = forwardRef<HTMLDivElement, VirtuosoScrollbarsProps>(function VirtuosoScrollbars(
	{ style, children, ...props },
	ref,
) {
	return (
		<CustomScrollbars style={style} ref={ref} renderView={(viewProps) => <div {...viewProps} {...props} tabIndex={-1} />}>
			{children}
		</CustomScrollbars>
	);
});

export default VirtuosoScrollbars;
