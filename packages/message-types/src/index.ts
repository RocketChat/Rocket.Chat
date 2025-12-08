import { MessageTypes } from './MessageTypes';
import registerCommonTypes from './registrations/common';
import registerE2EEETypes from './registrations/e2ee';
import registerLivechatTypes from './registrations/livechat';
import registerOmnichannelTypes from './registrations/omnichannel';
import registerVideoconfTypes from './registrations/videoconf';

const instance = new MessageTypes();

registerCommonTypes(instance);
registerLivechatTypes(instance);
registerOmnichannelTypes(instance);
registerE2EEETypes(instance);
registerVideoconfTypes(instance);

export { instance as MessageTypes };
