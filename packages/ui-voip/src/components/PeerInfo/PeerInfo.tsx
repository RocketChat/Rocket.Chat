import { ExternalUser, InternalUser } from '.';
import type { ExternalUserProps } from './ExternalUser';
import type { InternalUserProps } from './InternalUser';

export type PeerInfoProps = (InternalUserProps & { external?: false }) | (ExternalUserProps & { external: true });

const PeerInfo = (props: PeerInfoProps) => {
	if (props.external) {
		return <ExternalUser {...props} />;
	}

	return <InternalUser {...props} />;
};

export default PeerInfo;
