import type { ComponentProps, ReactElement } from 'react';

import UserStatus from './UserStatus';

type OfflineProps = Omit<ComponentProps<typeof UserStatus>, 'status'>;

function Offline(props: OfflineProps): ReactElement {
	return <UserStatus status='offline' {...props} />;
}

export default Offline;
