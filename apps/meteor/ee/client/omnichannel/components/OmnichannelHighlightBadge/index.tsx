import { Badge } from '@rocket.chat/fuselage';
import React from 'react';

import { useOmnichannelHighlight } from '../../hooks/useOmnichannelHighlight';

export const OmnichannelHighlightBadge = () => {
	const { isHighlightVisible } = useOmnichannelHighlight();

	if (!isHighlightVisible) {
		return null;
	}

	return <Badge variant='danger' small />;
};
