import type { ComponentPropsWithoutRef } from 'react';

import UserStatus from './UserStatus';

export type AwayProps = Omit<ComponentPropsWithoutRef<typeof UserStatus>, 'status'>;

function Away(props: AwayProps) {
	return <UserStatus status='away' {...props} />;
}

export default Away;
