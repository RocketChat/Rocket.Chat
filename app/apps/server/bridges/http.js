import { HTTP } from 'meteor/http';

export class AppHttpBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async call(info) {
		if (typeof info.request.timeout !== 'number' || info.request.timeout > 500) {
			info.request.timeout = 500;
		}

		if (!info.request.content && typeof info.request.data === 'object') {
			info.request.content = JSON.stringify(info.request.data);
		}

		this.orch.debugLog(`The App ${ info.appId } is requesting from the outter webs:`, info);

		try {
			return await HTTP.call(info.method, info.url, info.request);
		} catch (e) {
			return e.response;
		}
	}
}
