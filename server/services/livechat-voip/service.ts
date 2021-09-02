import { ILivechatVoipService } from '../../sdk/types/ILivechatVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';

export class LivechatVoipService extends ServiceClass implements ILivechatVoipService {
	protected name = 'livechat-voip';

	getConfiguration(): any {
		return {};
	}
}
