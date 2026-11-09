import type { ContextualbarContentProps } from './ContextualbarContent.js';
import ContextualbarContent from './ContextualbarContent.js';
import { Box } from '../Box/index.js';
import { StatesIcon, States, StatesTitle, StatesSubtitle, type StatesIconProps } from '../States/index.js';

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

export default ContextualbarEmptyContent;
