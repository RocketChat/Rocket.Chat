import { MessageTypes } from './MessageTypes.js';
import registerCommonTypes from './registrations/common.js';
import registerE2EEETypes from './registrations/e2ee.js';
import registerLivechatTypes from './registrations/livechat.js';
import registerOmnichannelTypes from './registrations/omnichannel.js';
import registerVideoconfTypes from './registrations/videoconf.js';

const instance = new MessageTypes();

registerCommonTypes(instance);
registerLivechatTypes(instance);
registerOmnichannelTypes(instance);
registerE2EEETypes(instance);
registerVideoconfTypes(instance);

export { instance as MessageTypes };
