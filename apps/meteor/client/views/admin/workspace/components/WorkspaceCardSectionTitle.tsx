import { Box } from '@rocket.chat/fuselage';
import React from 'react';

type WorkspaceCardSectionTitleProps = {
	variant?: 'p2b' | 'h4';
	title: string;
	titleToContentGap?: number;
};

const WorkspaceCardSectionTitle = ({ variant = 'p2b', title, titleToContentGap = 0 }: WorkspaceCardSectionTitleProps) => (
	<Box fontScale={variant} marginBlockEnd={titleToContentGap}>
		{title}
	</Box>
);

export default WorkspaceCardSectionTitle;
