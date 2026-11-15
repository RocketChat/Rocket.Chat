import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type HoverCardHeaderProps = {
	avatar?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	/** Controls aligned to the end of the header. */
	end?: ReactNode;
};

const HoverCardHeader = ({ avatar, title, subtitle, end }: HoverCardHeaderProps) => (
	<Box display='flex' alignItems='center'>
		{avatar}
		<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} marginInlineStart={avatar ? 'x4' : undefined} withTruncatedText>
			<Box fontScale='h4' color='titles-labels' withTruncatedText>
				{title}
			</Box>
			{subtitle && (
				<Box fontScale='p2' color='hint' withTruncatedText>
					{subtitle}
				</Box>
			)}
		</Box>
		{end && (
			<Box flexShrink={0} marginInlineStart='x8'>
				{end}
			</Box>
		)}
	</Box>
);

export default HoverCardHeader;
