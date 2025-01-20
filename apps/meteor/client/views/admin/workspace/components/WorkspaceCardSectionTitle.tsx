import { Box } from '@rocket.chat/fuselage';

type WorkspaceCardSectionTitleProps = {
	variant?: 'p2b' | 'h4';
	title: string;
};

const WorkspaceCardSectionTitle = ({ variant = 'p2b', title }: WorkspaceCardSectionTitleProps) => (
	<Box fontScale={variant} marginBlockEnd={variant === 'h4' ? 20 : 0}>
		{title}
	</Box>
);

export default WorkspaceCardSectionTitle;
