import { Box, Margins } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

import UserInfoABACAttribute from './UserInfoABACAttribute';

type UserCardABACAttributesProps = {
	abacAttributes: string[];
} & ComponentProps<typeof Box>;

const UserInfoABACAttributes = ({ abacAttributes }: UserCardABACAttributesProps): ReactElement => {
	return (
		<Box flexWrap='wrap' display='flex' flexShrink={0} mb={8} is='span' fontScale='p2' withTruncatedText>
			{abacAttributes.map((attribute, index) => (
				<Margins inline={2} key={index}>
					<UserInfoABACAttribute attribute={attribute} />
				</Margins>
			))}
		</Box>
	);
};

export default UserInfoABACAttributes;
