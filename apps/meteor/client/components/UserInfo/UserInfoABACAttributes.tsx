import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

import UserInfoABACAttribute from './UserInfoABACAttribute';

type UserCardABACAttributesProps = {
	abacAttributes: string[];
} & ComponentProps<typeof Box>;

const UserInfoABACAttributes = ({ abacAttributes, ...props }: UserCardABACAttributesProps): ReactElement => {
	return (
		<Box flexWrap='wrap' display='flex' flexShrink={0} mb={8} is='span' fontScale='p2' color='hint' withTruncatedText {...props}>
			{abacAttributes.map((attribute, index) => (
				<Box m={2} fontScale='c2' key={index}>
					<UserInfoABACAttribute attribute={attribute} />
				</Box>
			))}
		</Box>
	);
};

export default UserInfoABACAttributes;
