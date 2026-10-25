import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import UserInfoABACAttribute from './UserInfoABACAttribute';

export type UserInfoABACAttributesProps = {
	abacAttributes: IAbacAttributeDefinition[];
};

const UserInfoABACAttributes = ({ abacAttributes }: UserInfoABACAttributesProps) => {
	return (
		<Box flexWrap='wrap' display='flex' flexShrink={0} gap='x4' marginBlock='x8'>
			{abacAttributes.map((attribute, index) =>
				attribute.values.map((value) => <UserInfoABACAttribute key={`${attribute.key}-${value}-${index}`} attribute={value} />),
			)}
		</Box>
	);
};

export default UserInfoABACAttributes;
