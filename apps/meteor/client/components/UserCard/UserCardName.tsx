import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode, ComponentProps } from 'react';

import * as UserStatus from '../UserStatus';

type UserCardNameProps = ComponentProps<typeof Box> & {
    name: ReactNode;
    status: ReactNode;
};

const UserCardName = ({ name, status = <UserStatus.Offline />, ...props }: UserCardNameProps): ReactElement => (
    <Box
        display='flex'
        title={name}
        flexGrow={2}
        flexShrink={1}
        flexBasis={0}
        alignItems='center'
        fontScale='h4'
        color='default'
        withTruncatedText
        {...props}
    >
        {status}
        <Box mis={8} flexGrow={1} withTruncatedText>
            {name}
        </Box>
    </Box>
);

export default UserCardName;