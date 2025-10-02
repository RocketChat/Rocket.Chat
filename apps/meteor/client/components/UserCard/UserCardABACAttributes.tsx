import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import UserCardABACAttribute from './UserCardABACAttribute';
import UserCardInfo from './UserCardInfo';

type UserCardABACAttributesProps = {
	abacAttributes: string[];
};

const UserCardABACAttributes = ({ abacAttributes }: UserCardABACAttributesProps): ReactElement => {
	return (
		<UserCardInfo flexWrap='wrap' display='flex' flexShrink={0}>
			{abacAttributes.map((attribute, index) => (
				<Box m={2} fontScale='c2' key={index}>
					<UserCardABACAttribute attribute={attribute} />
				</Box>
			))}
		</UserCardInfo>
	);
};

export default UserCardABACAttributes;
