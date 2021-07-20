import React from 'react';

import CannedResponseEdit from './CannedResponseEditAdmin';

function CannedResponseNew({ reload }) {
	return <CannedResponseEdit reload={reload} isNew />;
}

export default CannedResponseNew;
