import type { IUser } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

import { UserCardName } from '../UserCard';

type UserInfoNameProps = {
    name: IUser['name'];
    status: ReactElement;
} & ComponentProps<typeof Box>;

const UserInfoName = ({ name, status, ...props }: UserInfoNameProps): ReactElement => (
    <UserCardName name={name} status={status} {...props} />
);
    
export default UserInfoName;