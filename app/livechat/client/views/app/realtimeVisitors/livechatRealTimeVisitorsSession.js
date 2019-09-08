import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { settings } from '../../../../../settings';
import { t } from '../../../../../utils';
import './livechatRealTimeVisitorsSession.html';


Template.livechatRealTimeVisitorSession.helpers({
	user() {
		return Template.instance().data;
	},
	pageTitle() {
		return this.navigation.page.title || t('Empty_title');
	},
	geolocationError() {
		const access = Template.instance().geolocation.get();
		const { location } = Template.instance().data;
		if (!access) {
			return t('Livechat_session_geolocation');
		}
		if (!location) {
			return t('Livechat_location_denied');
		}
	},
	checkLocationPermission() {
		const permission = settings.get('Livechat_location_permission') && settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations');
		if (permission) {
			return true;
		}
		return false;
	},
	mapOptions() {
		const { location: { latitude, longitude } = {} } = Template.instance().data;
		return `https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=500x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ settings.get('MapView_GMapsAPIKey') }`;
	},
});

Template.livechatRealTimeVisitorSession.onCreated(function() {
	this.geolocation = new ReactiveVar(true);
	this.autorun(() => {
		const isMapViewEnabled = settings.get('MapView_Enabled') === true;
		const googleMapsApiKey = settings.get('MapView_GMapsAPIKey');
		const canGetGeolocation = isMapViewEnabled && (googleMapsApiKey && googleMapsApiKey.length);

		if (!canGetGeolocation) {
			Template.instance().geolocation.set(false);
		}
	});
});
