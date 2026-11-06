import { ExternalUser, InternalUser } from '.';
import type { ExternalUserProps } from './ExternalUser';
import type { InternalUserProps } from './InternalUser';

export type PeerInfoProps = InternalUserProps | ExternalUserProps;

const PeerInfo = (props: PeerInfoProps) => {
	if ('number' in props) {
		return <ExternalUser {...props} />;
	}

	return <InternalUser {...props} />;
};

export default PeerInfo;
