import React from 'react';

import VoIPLayout from './VoIPLayout';
import { useVoipUser } from '../../contexts/OmnichannelContext';

function VoIPRouter(): React.ReactElement {
	const voipUser = useVoipUser();

	if(!voipUser) {
		return <div>loading</div> // TODO: :)
	}
	return <VoIPLayout></VoIPLayout>;
}
export default VoIPRouter;
