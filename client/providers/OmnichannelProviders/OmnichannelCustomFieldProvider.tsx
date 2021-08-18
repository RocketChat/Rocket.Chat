import React, { FC, useMemo, memo } from 'react';

import { OmnichannelCustomFieldContext } from '../../contexts/OmnichannelContext/OmnichannelCustomFieldsContext';
import { useEndpointData } from '../../hooks/useEndpointData';

export const OmnichannelCustomFieldProvider: FC = ({ children }) => {
	const { value = { customFields: [] } /* phase, reload */ } =
		useEndpointData('livechat/custom-fields');

	const context = useMemo(() => ({ customFields: value.customFields }), [value.customFields]);

	return <OmnichannelCustomFieldContext.Provider children={children} value={context} />;
};

export default memo(OmnichannelCustomFieldProvider);
