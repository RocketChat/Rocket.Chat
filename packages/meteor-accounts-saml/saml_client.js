/* globals cordova */

if (!Accounts.saml) {
	Accounts.saml = {};
}

// Override the standard logout behaviour.
//
// If we find a samlProvider, and we are using single
// logout we will initiate logout from rocketchat via saml.
// If not using single logout, we just do the standard logout.
// This can be overridden by a configured logout behaviour.
//
// TODO: This may need some work as it is not clear if we are really
// logging out of the idp when doing the standard logout.

const MeteorLogout = Meteor.logout;
const logoutBehaviour = {
	TERMINATE_SAML: 'SAML',
	ONLY_RC: 'Local'
};

Meteor.logout = function() {
	const samlService = ServiceConfiguration.configurations.findOne({ service: 'saml' });
	if (samlService) {
		const provider = samlService.clientConfig && samlService.clientConfig.provider;
		if (provider) {
			if (samlService.logoutBehaviour === logoutBehaviour.TERMINATE_SAML) {
				if (samlService.idpSLORedirectURL) {
					console.info('SAML session terminated via SLO');
					return Meteor.logoutWithSaml({ provider });
				}
				if (samlService.logoutBehaviour === logoutBehaviour.ONLY_RC) {
					console.info('SAML session not terminated, only the Rocket.Chat session is going to be killed');
				}
			}
		}
	}
	return MeteorLogout.apply(Meteor, arguments);
};

const openCenteredPopup = function(url, width, height) {
	let newwindow;

	if (typeof cordova !== 'undefined' && typeof cordova.InAppBrowser !== 'undefined') {
		newwindow = cordova.InAppBrowser.open(url, '_blank');
		newwindow.closed = false;

		const intervalId = setInterval(function() {
			newwindow.executeScript({
				'code': 'document.getElementsByTagName("script")[0].textContent'
			}, function(data) {
				if (data && data.length > 0 && data[0] === 'window.close()') {
					newwindow.close();
					newwindow.closed = true;
				}
			});
		}, 100);

		newwindow.addEventListener('exit', function() {
			clearInterval(intervalId);
		});
	} else {
		const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
		const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
		const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
		const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.body.clientHeight - 22);
		// XXX what is the 22?

		// Use `outerWidth - width` and `outerHeight - height` for help in
		// positioning the popup centered relative to the current window
		const left = screenX + (outerWidth - width) / 2;
		const top = screenY + (outerHeight - height) / 2;
		const features = (`width=${ width },height=${ height
		},left=${ left },top=${ top },scrollbars=yes`);

		newwindow = window.open(url, 'Login', features);
		if (newwindow.focus) {
			newwindow.focus();
		}
	}
	return newwindow;
};

Accounts.saml.initiateLogin = function(options, callback, dimensions) {
	// default dimensions that worked well for facebook and google
	const popup = openCenteredPopup(
		Meteor.absoluteUrl(`_saml/authorize/${ options.provider }/${ options.credentialToken }`), (dimensions && dimensions.width) || 650, (dimensions && dimensions.height) || 500);

	const checkPopupOpen = setInterval(function() {
		let popupClosed;
		try {
			// Fix for #328 - added a second test criteria (popup.closed === undefined)
			// to humour this Android quirk:
			// http://code.google.com/p/android/issues/detail?id=21061
			popupClosed = popup.closed || popup.closed === undefined;
		} catch (e) {
			// For some unknown reason, IE9 (and others?) sometimes (when
			// the popup closes too quickly?) throws 'SCRIPT16386: No such
			// interface supported' when trying to read 'popup.closed'. Try
			// again in 100ms.
			return;
		}

		if (popupClosed) {
			clearInterval(checkPopupOpen);
			callback(options.credentialToken);
		}
	}, 100);
};


Meteor.loginWithSaml = function(options, callback) {
	options = options || {};
	const credentialToken = `id-${ Random.id() }`;
	options.credentialToken = credentialToken;

	Accounts.saml.initiateLogin(options, function(/*error, result*/) {
		Accounts.callLoginMethod({
			methodArguments: [{
				saml: true,
				credentialToken
			}],
			userCallback: callback
		});
	});
};

Meteor.logoutWithSaml = function(options/*, callback*/) {
	//Accounts.saml.idpInitiatedSLO(options, callback);
	Meteor.call('samlLogout', options.provider, function(err, result) {
		if (err || !result) {
			MeteorLogout.apply(Meteor);
			return;
		}
		// A nasty bounce: 'result' has the SAML LogoutRequest but we need a proper 302 to redirected from the server.
		//window.location.replace(Meteor.absoluteUrl('_saml/sloRedirect/' + options.provider + '/?redirect='+result));
		window.location.replace(Meteor.absoluteUrl(`_saml/sloRedirect/${ options.provider }/?redirect=${ encodeURIComponent(result) }`));
	});
};
