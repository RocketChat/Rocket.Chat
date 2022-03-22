import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatUnit from '../models/LivechatUnit';

export class LivechatUnitRaw extends BaseRaw<typeof LivechatUnit> {}

export default new LivechatUnitRaw(LivechatUnit.model.rawCollection());
