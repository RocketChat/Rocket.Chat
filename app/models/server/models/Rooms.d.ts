import { Base } from './_Base';
import { IRoom } from '../../../events/definitions/room/IRoom';

declare class RoomsClass extends Base<IRoom> {}

declare const Rooms: RoomsClass;

export default Rooms;
