import { Tag } from '@rocket.chat/fuselage';

type UserInfoABACAttributeProps = {
	attribute: string;
};

const UserInfoABACAttribute = ({ attribute }: UserInfoABACAttributeProps) => {
	return <Tag variant='secondary-warning' children={attribute} />;
};

export default UserInfoABACAttribute;
