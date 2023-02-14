import { API } from '../api';

API.helperMethods.set('isUserFromParams', function _isUserFromParams(this: any) {
	const params = this.requestParams();

	return (
		(!params.userId && !params.username && !params.user) ||
		(params.userId && this.userId === params.userId) ||
		(params.username && this.user.username === params.username) ||
		(params.user && this.user.username === params.user)
	);
});
