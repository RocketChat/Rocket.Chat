/* globals _ */

export class ApiAiAdapter {
	constructor(adapterProps) {
		this.properties = adapterProps;
		this.headers = {
			'Content-Type': 'application/json; charset=utf-8',
			'Authorization': `Bearer ${ this.properties.token }`
		};
	}

	onMessage(message) {
		const responseAPIAI = HTTP.post(this.properties.url, {
			data: {
				query: message.msg,
				lang: this.properties.language
			},
			headers: this.headers
		});
		if (responseAPIAI.data && responseAPIAI.data.status.code === 200 && !_.isEmpty(responseAPIAI.data.result.fulfillment.speech)) {
			RocketChat.models.LivechatExternalMessage.insert({
				rid: message.rid,
				msg: responseAPIAI.data.result.fulfillment.speech,
				orig: message._id,
				ts: new Date()
			});
		}
	}

	onClose() {
		//do nothing, api.ai does not learn from us.
	}
}
