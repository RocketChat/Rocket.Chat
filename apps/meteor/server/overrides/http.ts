import { HTTP } from 'meteor/http';

import { httpCall } from '../lib/http/call';

HTTP.call = function _call(...args: Parameters<typeof HTTP.call>): ReturnType<typeof HTTP.call> {
	return httpCall.call(HTTP, ...args);
};
