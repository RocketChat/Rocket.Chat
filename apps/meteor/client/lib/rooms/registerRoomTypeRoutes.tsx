import { lazy } from 'react';

import { roomCoordinator } from './roomCoordinator';
import { router } from '../../providers/RouterProvider';
import MainLayout from '../../views/root/MainLayout';
import { appLayout } from '../appLayout';

// Lazy, matching the convention in client/startup/routes.tsx: MainLayout is imported statically
// (it is generic and provides its own <Suspense>) while the page component is loaded on demand.
const RoomRoute = lazy(() => import('../../views/room/RoomRoute'));

/**
 * Registers a router route for every room type that declares one.
 *
 * This lives in the view layer — rather than in the room-type coordinator — so the coordinator
 * (a lib-level singleton) never imports the room view tree. That import used to form a dependency
 * cycle (roomCoordinator → room UI → roomCoordinator) which made Vite re-execute the coordinator
 * on every HMR edit of a room component, wiping its registered `roomTypes` and crashing the room.
 *
 * Must be called after all room types have been registered (see client/lib/rooms/roomTypes).
 */
export const registerRoomTypeRoutes = (): void => {
	for (const { name, path, extractOpenRoomParams } of roomCoordinator.getRoomTypeRoutes()) {
		router.defineRoutes([
			{
				path,
				id: name,
				element: appLayout.wrap(
					<MainLayout>
						<RoomRoute key={name} extractOpenRoomParams={extractOpenRoomParams} />
					</MainLayout>,
				),
			},
		]);
	}
};
