import type { ComponentProps, ReactElement } from 'react';

import UserStatus from './UserStatus';

type BusyProps = Omit<ComponentProps<typeof UserStatus>, 'status'>;

function Busy(props: BusyProps): ReactElement {
	return <UserStatus status='busy' {...props} />;
}

export default Busy;
