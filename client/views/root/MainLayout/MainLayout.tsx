import React, { ReactElement } from 'react';

import BlazeTemplate from '../BlazeTemplate';
import PageLoading from '../PageLoading';
import { useAllowRead } from './useAllowRead';
import { useCollectionsAvailability } from './useCollectionsAvailability';
import { useCustomScript } from './useCustomScript';
import { useTooltipHandling } from './useTooltipHandling';
import { useTouchEventCorrection } from './useTouchEventCorrection';
import { useViewportScrolling } from './useViewportScrolling';

type MainLayoutProps = {
	center?: string;
};

const MainLayout = ({ center }: MainLayoutProps): ReactElement => {
	const ready = useCollectionsAvailability();
	useTooltipHandling();
	useTouchEventCorrection();
	const allowedRead = useAllowRead(ready);
	useViewportScrolling(allowedRead);
	useCustomScript(allowedRead);

	if (!ready) {
		return <PageLoading />;
	}

	return <BlazeTemplate template='main' data={{ center }} />;
};

export default MainLayout;
