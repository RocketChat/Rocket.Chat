import type { ExternalUserProps } from './ExternalUser.js';
import type { InternalUserProps } from './InternalUser.js';
import { ExternalUser, InternalUser } from './index.js';

export type PeerInfoProps = InternalUserProps | ExternalUserProps;

const PeerInfo = (props: PeerInfoProps) => {
	if ('number' in props) {
		return <ExternalUser {...props} />;
	}

	return <InternalUser {...props} />;
};

export default PeerInfo;
