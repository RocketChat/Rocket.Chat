import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import CannedResponse from '../models/CannedResponse';

export class CannedResponseRaw extends BaseRaw {}

export default new CannedResponseRaw(CannedResponse.model.rawCollection());
