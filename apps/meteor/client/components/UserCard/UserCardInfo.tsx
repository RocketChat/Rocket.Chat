import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type UserCardInfoProps = BoxProps;

const UserCardInfo = (props: UserCardInfoProps) => (
	<Box marginBlock={8} is='span' fontScale='p2' color='hint' withTruncatedText {...props} />
);

export default UserCardInfo;
