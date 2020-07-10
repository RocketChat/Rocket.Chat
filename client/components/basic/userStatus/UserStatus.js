import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import statusColors from '../../../helpers/statusColors';

const UserStatus = React.memo(({ status, ...props }) => <Box size='x12' borderRadius='full' backgroundColor={statusColors[status]} {...props}/>);

export default UserStatus;
