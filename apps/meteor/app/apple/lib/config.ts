export const config = {
	serverURL: 'https://appleid.apple.com',
	authorizePath: '/auth/authorize?response_mode=form_post',
	responseType: 'code id_token',
	tokenPath: '/auth/token',
	scope: 'name email',
	mergeUsers: true,
	accessTokenParam: 'access_token',
	loginStyle: 'popup',
};
