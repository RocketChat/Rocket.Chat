import InternalUser from './InternalUser.js';
import PhoneNumber from './PhoneNumber.js';

export type ExternalUserProps = {
	number: string;
	displayName?: string;
	avatarUrl?: string;
};

const ExternalUser = ({ number, displayName, avatarUrl }: ExternalUserProps) => {
	if (displayName) {
		return <InternalUser displayName={displayName} avatarUrl={avatarUrl} callerId={number} />;
	}

	return <PhoneNumber number={number} />;
};

export default ExternalUser;
