import React, { FC, useMemo, memo } from 'react';

import { OmnichannelDepartmentContext } from '../../contexts/OmnichannelContext/OmnichannelDepartmentContext';
import { useEndpointData } from '../../hooks/useEndpointData';

export const OmnichannelDepartmentProvider: FC = ({ children }) => {
	const { value = { departments: [] } /* phase, reload */ } =
		useEndpointData('livechat/department');

	const context = useMemo(() => ({ departments: value.departments }), [value.departments]);

	return <OmnichannelDepartmentContext.Provider children={children} value={context} />;
};

export default memo(OmnichannelDepartmentProvider);
