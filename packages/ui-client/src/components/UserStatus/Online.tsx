import type { ComponentProps, ReactElement } from 'react';

import UserStatus from './UserStatus';

type OnlineProps = Omit<ComponentProps<typeof UserStatus>, 'status'>;

function Online(props: OnlineProps): ReactElement {
	return <UserStatus status='online' {...props} />;
}

export default Online;
