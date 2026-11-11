import { Text } from '@rocket.chat/fuselage';

export type WorkspaceCardSectionTitleProps = {
	variant?: 'p2b' | 'h4';
	title: string;
};

const WorkspaceCardSectionTitle = ({ variant = 'p2b', title }: WorkspaceCardSectionTitleProps) => (
	<Text is={variant === 'h4' ? 'h3' : 'div'} fontScale={variant}>
		{title}
	</Text>
);

export default WorkspaceCardSectionTitle;
