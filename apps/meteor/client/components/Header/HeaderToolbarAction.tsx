import { HeaderV2ToolbarAction } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React, { forwardRef, memo } from 'react';

const HeaderToolbarAction = forwardRef<HTMLButtonElement, ComponentProps<typeof HeaderV2ToolbarAction>>(
	function HeaderToolbarAction(props, ref) {
		return <HeaderV2ToolbarAction ref={ref} {...props} />;
	},
);

export default memo(HeaderToolbarAction);
