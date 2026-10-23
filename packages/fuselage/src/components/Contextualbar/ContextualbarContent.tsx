import type { RefAttributes } from 'react';
import { memo } from 'react';

import { Box, type BoxProps } from '../Box';

export type ContextualbarContentProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLElement> & {
		/** Drops the inline padding, for content such as a list whose items bring their own. */
		flush?: boolean;
		/** Adds a 12px block padding, so the first and last items keep clear of the header and footer. */
		spaced?: boolean;
	};

function ContextualbarContent({ flush, spaced, ...props }: ContextualbarContentProps) {
	return (
		<Box
			rcx-vertical-bar__content
			paddingInline={flush ? 0 : 24}
			paddingBlock={spaced ? 12 : undefined}
			display='flex'
			flexDirection='column'
			overflowY='hidden'
			height='full'
			{...props}
		/>
	);
}

export default memo(ContextualbarContent);
