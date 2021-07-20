import React from 'react';

import CannedResponseEdit from './CannedResponseEdit';

function CannedResponseNew({ reload }) {
	return <CannedResponseEdit reload={reload} isNew />;
}

export default CannedResponseNew;
