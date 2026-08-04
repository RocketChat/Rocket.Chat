import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

const UserCardInfo = (props: BoxProps) => <Box marginBlock={8} is='span' fontScale='p2' color='hint' withTruncatedText {...props} />;

export default UserCardInfo;
