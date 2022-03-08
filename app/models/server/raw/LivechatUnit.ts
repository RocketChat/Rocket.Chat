import { BaseRaw } from './BaseRaw';
import { LivechatUnit } from '../../../../ee/app/models/server';

export class LivechatUnitRaw extends BaseRaw<typeof LivechatUnit> {}

export default new LivechatUnitRaw(LivechatUnit.model.rawCollection());
