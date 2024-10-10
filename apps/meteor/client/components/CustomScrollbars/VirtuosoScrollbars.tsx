import type { Ref } from 'react';
import React, { forwardRef, memo } from 'react';

import type { CustomScrollbarsProps } from './CustomScrollbars';
import CustomScrollbars from './CustomScrollbars';

type VirtuosoScrollbarsProps = CustomScrollbarsProps;

const VirtuosoScrollbars = forwardRef(function VirtuosoScrollbars(
	{ style, children, ...props }: VirtuosoScrollbarsProps,
	ref: Ref<HTMLElement>,
) {
	return (
		<CustomScrollbars style={style} ref={ref} renderView={(viewProps) => <div {...viewProps} {...props} tabIndex={-1} />}>
			{children}
		</CustomScrollbars>
	);
});

export default memo(VirtuosoScrollbars);
