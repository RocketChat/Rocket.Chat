import { ConferenceErrorState } from '@rocket.chat/ui-conference';

import RoomLayout from '../../room/layout/RoomLayout';

/**
 * The chat panel could not be opened, for a reason that says nothing about the room.
 *
 * Distinct from `RoomNotFound`, which is an answer — the room is gone, or was never this participant's to read.
 * A server that did not answer at all is not that, so this says what is known and offers to ask again, laid out
 * as the room would have been.
 */
const ConferenceRoomError = ({ onRetry }: { onRetry: () => void }) => <RoomLayout body={<ConferenceErrorState onRetry={onRetry} />} />;

export default ConferenceRoomError;
