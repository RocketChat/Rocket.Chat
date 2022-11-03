import { API } from '../api';

API.helperMethods.set('requestParams', function _requestParams(this: any) {
	return ['POST', 'PUT', 'DELETE'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
