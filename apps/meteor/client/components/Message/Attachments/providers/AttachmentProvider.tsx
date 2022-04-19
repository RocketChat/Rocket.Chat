import { usePrefersReducedData } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, FC } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useUserPreference } from '../../../../contexts/UserContext';
import { AttachmentContext, AttachmentContextValue } from '../context/AttachmentContext';

const AttachmentProvider: FC = ({ children }) => {
	const { isMobile } = useLayout();
	const reducedData = usePrefersReducedData();
	const collapsedByDefault = !!useUserPreference<boolean>('collapseMediaByDefault');
	const autoLoadEmbedMedias = !!useUserPreference<boolean>('autoImageLoad');
	const saveMobileBandwidth = !!useUserPreference<boolean>('saveMobileBandwidth');

	const contextValue: AttachmentContextValue = useMemo(
		() => ({
			getURL: (url: string): string => getURL(url, { full: true }),
			collapsedByDefault,
			autoLoadEmbedMedias: !reducedData && autoLoadEmbedMedias && (!saveMobileBandwidth || !isMobile),
			dimensions: {
				width: 480,
				height: 360,
			},
		}),
		[collapsedByDefault, reducedData, autoLoadEmbedMedias, saveMobileBandwidth, isMobile],
	);

	return <AttachmentContext.Provider children={children} value={contextValue} />;
};

export default AttachmentProvider;
