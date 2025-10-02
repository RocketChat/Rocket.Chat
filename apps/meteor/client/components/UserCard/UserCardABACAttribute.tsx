import { Tag } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type UserCardABACAttributeProps = {
	attribute: string;
};

const UserCardABACAttribute = ({ attribute }: UserCardABACAttributeProps): ReactElement => {
	return <Tag variant='secondary-warning' children={attribute} />;
};

export default UserCardABACAttribute;
