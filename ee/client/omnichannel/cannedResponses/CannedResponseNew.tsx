import React, { FC } from 'react';

import CannedResponseEdit from './CannedResponseEdit';

const CannedResponseNew: FC<{ reload: () => void }> = ({ reload }) => (
	<CannedResponseEdit reload={reload} isNew />
);

export default CannedResponseNew;
