import type { FC } from 'react';
import React from 'react';

import CannedResponseEdit from './CannedResponseEdit';

const CannedResponseNew: FC<{
	reload: () => void;
	totalDataReload: () => void;
}> = ({ reload, totalDataReload }) => <CannedResponseEdit reload={reload} totalDataReload={totalDataReload} isNew />;

export default CannedResponseNew;
