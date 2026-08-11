import { Margins } from '@rocket.chat/fuselage';
import type { ComponentProps, RefAttributes } from 'react';
import { memo } from 'react';

import { PageScrollableContent } from '../Page';

export type ContextualbarScrollableContentProps = ComponentProps<typeof PageScrollableContent> & RefAttributes<HTMLElement>;

const ContextualbarScrollableContent = ({ children, ref, ...props }: ContextualbarScrollableContentProps) => (
	<PageScrollableContent paddingInline={16} {...props} ref={ref}>
		<Margins blockEnd={16}>{children}</Margins>
	</PageScrollableContent>
);

export default memo(ContextualbarScrollableContent);
