import React, { useMemo, FC } from 'react';
import { usePrefersReducedData } from '@rocket.chat/fuselage-hooks';

import { AttachmentContext, AttachmentContextValue } from '../context/AttachmentContext';
import { useUserPreference } from '../../../../contexts/UserContext';
import { getURL } from '../../../../../app/utils/client';

const AttachmentProvider: FC<{}> = ({ children }) => {
	const reducedData = usePrefersReducedData();
	const collapsedByDefault = !!useUserPreference<boolean>('collapseMediaByDefault');
	const autoLoadEmbedMedias = !!useUserPreference<boolean>('autoImageLoad');
	const saveMobileBandwidth = !!useUserPreference<boolean>('saveMobileBandwidth');

	const contextValue: AttachmentContextValue = useMemo(() => ({
		getURL: getURL as (url: string) => string,
		collapsedByDefault,
		autoLoadEmbedMedias: !reducedData && (autoLoadEmbedMedias && !saveMobileBandwidth),
		dimensions: {
			width: 480,
			height: 300,
		},
	}), [autoLoadEmbedMedias, collapsedByDefault, saveMobileBandwidth, reducedData]);

	return <AttachmentContext.Provider children={children} value={contextValue} />;
};

export default AttachmentProvider;
