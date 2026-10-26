import { memo } from 'react';

import { Box } from '../Box';
import { StatesIcon, States, StatesTitle, StatesSubtitle, type StatesIconProps } from '../States';
import type { ContextualbarContentProps } from './ContextualbarContent';
import ContextualbarContent from './ContextualbarContent';

export type ContextualbarEmptyContentProps = ContextualbarContentProps & {
	icon?: StatesIconProps['name'];
	title?: string;
	subtitle?: string;
};

function ContextualbarEmptyContent({ icon = 'magnifier', title = 'Nothing Found', subtitle, ...props }: ContextualbarEmptyContentProps) {
	return (
		<ContextualbarContent {...props}>
			<Box rcx-vertical-bar__empty>
				<States>
					<StatesIcon name={icon} />
					<StatesTitle>{title}</StatesTitle>
					{subtitle && <StatesSubtitle>{subtitle}</StatesSubtitle>}
				</States>
			</Box>
		</ContextualbarContent>
	);
}

export default memo(ContextualbarEmptyContent);
