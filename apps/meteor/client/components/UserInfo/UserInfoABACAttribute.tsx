import { Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type UserInfoABACAttributeProps = {
	attribute: string;
};

const UserInfoABACAttribute = ({ attribute }: UserInfoABACAttributeProps): ReactElement => {
	return <Tag variant='secondary-warning' children={attribute} />;
};

export default UserInfoABACAttribute;
