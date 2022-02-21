import { API } from '../api';

(API as any).helperMethods.set('requestParams', function _requestParams(this: any) {
	return ['POST', 'PUT'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
