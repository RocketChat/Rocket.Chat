
const errorCodes = {
	NO_BODY_PARSER: 'SLACKEVENTMIDDLEWARE_NO_BODY_PARSER',
	TOKEN_VERIFICATION_FAILURE: 'SLACKEVENTMIDDLEWARE_TOKEN_VERIFICATION_FAILURE'
};

const responseStatuses = {
	OK: 200,
	FAILURE: 500,
	REDIRECT: 302,
	FORBIDDEN: 403
};

function responseSuccess(responseOptions = {}) {
	const content = responseOptions.content || {};

	return content;
}

function responseError(err, responseOptions = {}) {
	const statusCode = responseOptions.statusCode || responseStatuses.FAILURE;
	const headers = responseOptions.headers || { 'Content-Type': 'text/plain' };

	if (responseOptions && responseOptions.failWithNoRetry) {
		headers['X-Slack-No-Retry'] = '1';
	}

	return {
		statusCode,
		headers,
		body: ' '
	};
}

const API = new Restivus({
	prettyJson: true,
	enableCors: false,
	apiPath: 'hooks/'
});

API.addRoute('slack/events', { authRequired: false }, {
	post() {
		const adapter = RocketChat.SlackBridge.slackEventAdapter;

		if (!adapter) {
			return responseError({ statusCode: responseStatuses.FORBIDDEN });
		}

		// // Check that the request body has been parsed
		if (!this.bodyParams) {
			const error = new Error('The incoming HTTP request did not have a parsed body.');
			error.code = errorCodes.NO_BODY_PARSER;
			adapter.emit('error', error);

			return responseError(error);
		}

		// Handle URL verification challenge
		if (this.bodyParams.type === 'url_verification') {
			if (this.bodyParams.token !== adapter.verificationToken) {
				const error = new Error('Slack event challenge failed.');
				error.code = errorCodes.TOKEN_VERIFICATION_FAILURE;
				error.body = this.bodyParams;
				adapter.emit('error', error);

				return responseError(error);
			}
			return responseSuccess({ content: this.bodyParams.challenge });
		}

		// Handle request token verification
		if (!this.bodyParams.token || this.bodyParams.token !== adapter.verificationToken) {
			const error = new Error('Slack event verification failed');
			error.code = errorCodes.TOKEN_VERIFICATION_FAILURE;
			error.body = this.bodyParams;
			adapter.emit('error', error);

			return responseError(error);
		}

		try {
			adapter.emit(this.bodyParams.event.type, this.bodyParams.event);
		} catch (error) {
			return responseError(error);
		}
		return responseSuccess();
	}
});
