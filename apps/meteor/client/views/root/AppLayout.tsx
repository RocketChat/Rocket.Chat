import { PaletteStyleTag } from '@rocket.chat/ui-theming/src/PaletteStyleTag';
import { SidebarPaletteStyleTag } from '@rocket.chat/ui-theming/src/SidebarPaletteStyleTag';
import type { FC } from 'react';
import React, { Fragment, Suspense } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { appLayout } from '../../lib/appLayout';
import { blazePortals } from '../../lib/portals/blazePortals';
import { useExperimentalTheme } from '../hooks/useExperimentalTheme';
import PageLoading from './PageLoading';
import { useTooltipHandling } from './useTooltipHandling';

const AppLayout: FC = () => {
	useTooltipHandling();

	const theme = useExperimentalTheme();

	const layout = useSyncExternalStore(appLayout.subscribe, appLayout.getSnapshot);
	const portals = useSyncExternalStore(blazePortals.subscribe, blazePortals.getSnapshot);

	return (
		<>
			{theme && <PaletteStyleTag />}
			<SidebarPaletteStyleTag />
			<Suspense fallback={<PageLoading />}>{layout}</Suspense>
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default AppLayout;
