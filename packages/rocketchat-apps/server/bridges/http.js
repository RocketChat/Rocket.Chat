export class AppHttpBridge {
	call(info) {
		if (!info.request.content && typeof info.request.data === 'object') {
			info.request.content = JSON.stringify(info.request.data);
		}

		console.log(`The App ${ info.appId } is requesting from the outter webs:`, info);

		return new Promise((resolve, reject) => {
			HTTP.call(info.method, info.url, info.request, (e, result) => {
				return e ? reject(e.response) : resolve(result);
			});
		});
	}
}
