import { setRoomRouteElementFactory } from './roomCoordinator';
import RoomRoute from '../../views/room/RoomRoute';
import MainLayout from '../../views/root/MainLayout';
import { appLayout } from '../appLayout';

// Set up the room route element factory before any room types are registered
setRoomRouteElementFactory(({ name, extractOpenRoomParams }) =>
	appLayout.wrap(
		<MainLayout>
			<RoomRoute key={name} extractOpenRoomParams={extractOpenRoomParams} />
		</MainLayout>,
	),
);
