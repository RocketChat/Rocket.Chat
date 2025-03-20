import type { ComponentProps, ReactElement } from 'react';

import UserStatus from './UserStatus';

type AwayProps = Omit<ComponentProps<typeof UserStatus>, 'status'>;

function Away(props: AwayProps): ReactElement {
	return <UserStatus status='away' {...props} />;
}

export default Away;
