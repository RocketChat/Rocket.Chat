import React from 'react';

import { useCallClient } from '../../contexts/CallContext';
import VoIPLayout from './VoIPLayout';

function VoIPRouter(): React.ReactElement {
	const voipUser = useCallClient();

	if (!voipUser) {
		return <div>loading</div>; // TODO: :)
	}
	return <VoIPLayout voipUser={voipUser} />;
}
export default VoIPRouter;
