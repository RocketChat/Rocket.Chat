// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
	id: 'com.konecty.rocket.chat',
	version: '0.1.1',
	name: 'Rocket.Chat',
	description: 'Rocket.Chat',
	author: 'Rocket.Chat Development Group',
	email: 'contact@rocket.chat',
	website: 'https://rocket.chat'
});

// Set up resources such as icons and launch screens.
App.icons({
	iphone   : 'public/images/logo/apple-touch-icon-60x60.png',
	iphone_2x: 'public/images/logo/apple-touch-icon-120x120.png',
	iphone_3x: 'public/images/logo/apple-touch-icon-180x180.png',
	ipad     : 'public/images/logo/apple-touch-icon-76x76.png',
	ipad_2x  : 'public/images/logo/apple-touch-icon-152x152.png',

	android_ldpi : 'public/images/logo/android-mdpi.png',
	android_mdpi : 'public/images/logo/android-mdpi.png',
	android_hdpi : 'public/images/logo/android-hdpi.png',
	android_xhdpi: 'public/images/logo/android-xhdpi.png'
});

App.launchScreens({
	iphone            : 'splash/iphone.png',
	iphone_2x         : 'splash/iphone@2x.png',
	iphone5           : 'splash/iphone5.png',
	iphone6           : 'splash/iphone6.png',
	iphone6p_portrait : 'splash/iphone6p_portrait.png',
	iphone6p_landscape: 'splash/iphone6p_landscape.png',
	ipad_portrait     : 'splash/ipad_portrait.png',
	ipad_portrait_2x  : 'splash/ipad_portrait@2x.png',
	ipad_landscape    : 'splash/ipad_landscape.png',
	ipad_landscape_2x : 'splash/ipad_landscape@2x.png',

	android_ldpi_portrait  : 'splash/android-port-ldpi.png',
	android_ldpi_landscape : 'splash/android-land-ldpi.png',
	android_mdpi_portrait  : 'splash/android-port-mdpi.png',
	android_mdpi_landscape : 'splash/android-land-mdpi.png',
	android_hdpi_portrait  : 'splash/android-port-hdpi.png',
	android_hdpi_landscape : 'splash/android-land-hdpi.png',
	android_xhdpi_portrait : 'splash/android-port-xhdpi.png',
	android_xhdpi_landscape: 'splash/android-land-xhdpi.png'
});

// Set PhoneGap/Cordova preferences
App.setPreference('HideKeyboardFormAccessoryBar', true);
App.setPreference('StatusBarOverlaysWebView', false);
App.setPreference('StatusBarStyle', 'lightcontent');
App.setPreference('StatusBarBackgroundColor', '#000000');
App.accessRule('*');

// // Pass preferences for a particular PhoneGap/Cordova plugin
// App.configurePlugin('com.phonegap.plugins.facebookconnect', {
//   APP_ID: '1234567890',
//   API_KEY: 'supersecretapikey'
// });