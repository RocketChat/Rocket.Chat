import { Box, Margins } from '@rocket.chat/fuselage';

import UserInfoABACAttribute from './UserInfoABACAttribute';

type UserInfoABACAttributesProps = {
	abacAttributes: string[];
};

const UserInfoABACAttributes = ({ abacAttributes }: UserInfoABACAttributesProps) => {
	return (
		<Box m='neg-x2'>
			<Box flexWrap='wrap' display='flex' flexShrink={0} mb={8}>
				{abacAttributes.map((attribute, index) => (
					<Margins inline={2} blockEnd={4} key={`${attribute}-${index}`}>
						<UserInfoABACAttribute attribute={attribute} />
					</Margins>
				))}
			</Box>
		</Box>
	);
};

export default UserInfoABACAttributes;
