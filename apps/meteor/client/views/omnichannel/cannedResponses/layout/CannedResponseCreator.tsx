import { Box, Text } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';

export type CannedResponseCreatorProps = {
	username: string;
};

/**
 * The avatar and username of who created a canned response, truncated to its table cell.
 */
const CannedResponseCreator = ({ username }: CannedResponseCreatorProps) => (
	<Box display='flex' alignItems='center'>
		<UserAvatar size='x24' username={username} />
		<Box display='flex' withTruncatedText marginInline='x8'>
			<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
				<Text fontScale='p2m' truncate color='default'>
					{username}
				</Text>
			</Box>
		</Box>
	</Box>
);

export default CannedResponseCreator;
