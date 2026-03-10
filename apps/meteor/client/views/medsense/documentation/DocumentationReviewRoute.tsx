import { Box, Throbber } from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { lazy, useEffect, useMemo, useState } from 'react';

const DocumentationReviewPage = lazy(() => import('./DocumentationReviewPage'));

const DocumentationReviewRoute = () => {
	const interventionId = useRouteParameter('interventionId') as string;
	const roomId = useMemo(() => {
		if (typeof window === 'undefined') {
			return '';
		}

		return new URLSearchParams(window.location.search).get('roomId') || '';
	}, []);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!roomId || !interventionId) {
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const { sdk } = await import('../../../../app/utils/client/lib/SDKClient');
				const { room } = await sdk.rest.get('/v1/rooms.info', { roomId });
				if (!room) {
					throw new Error('Room not found');
				}

				const { roomCoordinator } = await import('../../../lib/rooms/roomCoordinator');
				const nextUrl = roomCoordinator.getURL(room.t, { ...room, tab: 'medsense-documentation', context: interventionId } as any);

				if (!nextUrl) {
					throw new Error('Unable to build room URL');
				}

				if (!cancelled) {
					window.location.assign(nextUrl);
				}
			} catch (reason: any) {
				if (!cancelled) {
					setError(reason?.message || 'Unable to open documentation panel');
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [interventionId, roomId]);

	if (roomId) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' height='full' padding={32}>
				{error ? <Box>{error}</Box> : <>
					<Throbber size='x24' />
					<Box marginBlockStart={16}>Opening documentation panel…</Box>
				</>}
			</Box>
		);
	}

	return <DocumentationReviewPage />;
};

export default DocumentationReviewRoute;
