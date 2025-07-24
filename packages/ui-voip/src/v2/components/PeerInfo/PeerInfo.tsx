import { ComponentProps } from 'react';

import { InternalUser, PhoneNumber } from '.';

export type PeerInfoProps = ComponentProps<typeof InternalUser> | ComponentProps<typeof PhoneNumber>;

const PeerInfo = (props: PeerInfoProps) => {
	if ('name' in props) {
		return <InternalUser {...props} />;
	}
	return <PhoneNumber {...props} />;
};

export default PeerInfo;
