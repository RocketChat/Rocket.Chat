import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatUnit from '../models/LivechatUnit';

export class LivechatUnitRaw extends BaseRaw {}

export default new LivechatUnitRaw(LivechatUnit.model.rawCollection());
