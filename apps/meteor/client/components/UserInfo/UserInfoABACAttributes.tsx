import { Box, Margins } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

import UserInfoABACAttribute from './UserInfoABACAttribute';

type UserCardABACAttributesProps = {
	abacAttributes: string[];
} & ComponentProps<typeof Box>;

const UserInfoABACAttributes = ({ abacAttributes }: UserCardABACAttributesProps): ReactElement => {
	return (
		<Box flexWrap='wrap' display='flex'>
			{abacAttributes.map((attribute, index) => (
				<Margins inline={2} blockEnd={4} key={index}>
					<UserInfoABACAttribute attribute={attribute} />
				</Margins>
			))}
		</Box>
	);
};

export default UserInfoABACAttributes;
