export class RocketletHttpBridge {
	call(info) {
		if (!info.request.content && typeof info.request.data === 'object') {
			info.request.content = JSON.stringify(info.request.data);
		}

		console.log(`The Rocketlet ${ info.rocketletId } is requesting from the outter webs:`, info);
		const result = HTTP.call(info.method, info.url, info.request);

		console.log('The result is:', result);

		return result;
	}
}
