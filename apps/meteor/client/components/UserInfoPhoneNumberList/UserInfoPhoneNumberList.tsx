import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import UserInfoPhoneNumberItem from './UserInfoPhoneNumberItem';

const UserInfoPhoneNumberList = ({ phones }: { phones: IUserPhoneNumber[] }) => (
	<Box is='ul' display='flex' flexDirection='column' gap={12}>
		{phones.map((phone, index) => (
			<UserInfoPhoneNumberItem key={`${phone.number}${phone.label}${index}`} {...phone} />
		))}
	</Box>
);

export default UserInfoPhoneNumberList;
