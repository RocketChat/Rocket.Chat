import type { ComponentProps, ReactElement, Ref } from 'react';
import React, { forwardRef } from 'react';

import CustomScrollbars from './CustomScrollbars';

type VirtuosoScrollbarsProps = ComponentProps<typeof CustomScrollbars>;

const VirtuosoScrollbars = forwardRef(function VirtuosoScrollbars(
	{ style, children, ...props }: VirtuosoScrollbarsProps,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	return (
		<CustomScrollbars
			style={{ ...style, flexGrow: 1, overflowY: 'hidden', width: '100%', willChange: 'transform' }}
			ref={ref}
			renderView={(viewProps): ReactElement => <div {...viewProps} {...props} tabIndex={-1} />}
		>
			{children}
		</CustomScrollbars>
	);
});

export default VirtuosoScrollbars;
