import type { ComponentProps, ReactElement } from 'react';

import UserStatus from './UserStatus';

type LoadingProps = Omit<ComponentProps<typeof UserStatus>, 'status'>;

function Loading(props: LoadingProps): ReactElement {
	return <UserStatus {...props} />;
}

export default Loading;
