import { Box } from '../Box';
import { StatesIcon, States, StatesTitle, StatesSubtitle, type StatesIconProps } from '../States';
import type { ContextualbarContentProps } from './ContextualbarContent';
import ContextualbarContent from './ContextualbarContent';

export type ContextualbarEmptyContentProps = ContextualbarContentProps & {
	icon?: StatesIconProps['name'];
	/** Colours the icon, such as `danger` when the panel failed to load. */
	iconVariation?: StatesIconProps['variation'];
	title?: string;
	subtitle?: string;
};

function ContextualbarEmptyContent({
	icon = 'magnifier',
	iconVariation,
	title = 'Nothing Found',
	subtitle,
	...props
}: ContextualbarEmptyContentProps) {
	return (
		<ContextualbarContent {...props}>
			<Box rcx-vertical-bar__empty>
				<States>
					<StatesIcon name={icon} variation={iconVariation} />
					<StatesTitle>{title}</StatesTitle>
					{subtitle && <StatesSubtitle>{subtitle}</StatesSubtitle>}
				</States>
			</Box>
		</ContextualbarContent>
	);
}

export default ContextualbarEmptyContent;
