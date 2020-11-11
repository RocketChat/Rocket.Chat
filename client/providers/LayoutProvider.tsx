import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { FC, useMemo } from 'react';

import { LayoutContext } from '../contexts/LayoutContext';
import { useQueryStringParameter } from '../contexts/RouterContext';
import { useSetting } from '../contexts/SettingsContext';
import { menu } from '../../app/ui-utils/client';

const LayoutProvider: FC = ({ children }) => {
	const showTopNavbarEmbeddedLayout = Boolean(useSetting('UI_Show_top_navbar_embedded_layout'));
	const isMobile = useMediaQuery('(max-width: 768px)');
	const layout = useQueryStringParameter('layout');
	const isEmbedded = layout === 'embedded';
	return <LayoutContext.Provider
		children={children}
		value={useMemo(() => ({
			isMobile,
			isEmbedded,
			showTopNavbarEmbeddedLayout,
			sidebar: menu,
		}), [isEmbedded, showTopNavbarEmbeddedLayout, isMobile])}
	/>;
};
export default LayoutProvider;
