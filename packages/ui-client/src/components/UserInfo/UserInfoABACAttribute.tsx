import { Tag } from '@rocket.chat/fuselage';

export type UserInfoABACAttributeProps = {
	attribute: string;
};

const UserInfoABACAttribute = ({ attribute }: UserInfoABACAttributeProps) => {
	return <Tag variant='secondary-warning'>{attribute}</Tag>;
};

export default UserInfoABACAttribute;
