import './additionalForms/register';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	require('./routes');
	require('./additionalForms/register');
});
