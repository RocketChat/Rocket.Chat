import ListSkeleton from '../../../components/ListSkeleton';
import RoomComposerSkeleton from '../../room/composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from '../../room/layout/RoomLayout';

/**
 * The room, still loading, as the call's chat panel will actually show it.
 *
 * `RoomSkeleton` draws a header too, and the room in this panel has none — so the panel spent the wait promising
 * a strip of chrome that never arrived, then dropped it when the room did.
 */
const ConferenceRoomSkeleton = () => (
	<RoomLayout
		body={
			<>
				<ListSkeleton />
				<RoomComposerSkeleton />
			</>
		}
	/>
);

export default ConferenceRoomSkeleton;
