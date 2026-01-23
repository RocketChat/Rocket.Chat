import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';

import UserInfoABACAttribute from './UserInfoABACAttribute';

type UserInfoABACAttributesProps = {
	abacAttributes: IAbacAttributeDefinition[];
};

const UserInfoABACAttributes = ({ abacAttributes }: UserInfoABACAttributesProps) => {
	return (
		<Box m='neg-x2'>
			<Box flexWrap='wrap' display='flex' flexShrink={0} mb={8}>
				{abacAttributes.map((attribute, index) =>
					attribute.values.map((value) => (
						<Margins inline={2} blockEnd={4} key={`${attribute.key}-${value}-${index}`}>
							<UserInfoABACAttribute attribute={value} />
						</Margins>
					)),
				)}
			</Box>
		</Box>
	);
};

export default UserInfoABACAttributes;
