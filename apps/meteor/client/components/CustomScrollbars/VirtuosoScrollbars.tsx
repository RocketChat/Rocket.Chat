import type { ComponentProps, Ref } from 'react';
import React, { forwardRef } from 'react';

import CustomScrollbars from './CustomScrollbars';

type VirtuosoScrollbarsProps = ComponentProps<typeof CustomScrollbars>;

const VirtuosoScrollbars = forwardRef(function VirtuosoScrollbars(
	{ style, children, ...props }: VirtuosoScrollbarsProps,
	ref: Ref<HTMLDivElement>,
) {
	return (
		<CustomScrollbars
			style={style}
			ref={ref}
			renderView={({ style, ...viewProps }) => <div style={{ ...style, overflowX: 'hidden' }} {...viewProps} {...props} tabIndex={-1} />}
		>
			{children}
		</CustomScrollbars>
	);
});

export default VirtuosoScrollbars;
