import React, { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import VoIPLayout from './VoIPLayout';

function VoIPRouter({ renderRoute }) {
	const [routeName] = useCurrentRoute();
	return (
		<VoIPLayout>
		</VoIPLayout>
	);
}

export default VoIPRouter;
