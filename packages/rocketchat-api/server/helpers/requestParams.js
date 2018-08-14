RocketChat.API.helperMethods.set('requestParams', function _requestParams() {
	return ['POST', 'PUT'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
