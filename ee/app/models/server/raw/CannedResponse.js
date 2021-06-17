import { BaseRaw } from '../../../../../server/models/raw/BaseRaw';
import CannedResponse from '../models/CannedResponse';

export class CannedResponseRaw extends BaseRaw {
}

export default new CannedResponseRaw(CannedResponse.model.rawCollection());
