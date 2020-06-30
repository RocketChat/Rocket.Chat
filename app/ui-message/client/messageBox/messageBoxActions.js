import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { VRecDialog } from '../../../ui-vrecord/client';
import { messageBox, modal } from '../../../ui-utils';
import { fileUpload } from '../../../ui';
import { settings } from '../../../settings';
import { t } from '../../../utils';
import { mime } from '../../../utils/lib/mimeTypes';
import { Rooms } from '../../../models';
import { call } from '../../../ui-utils/client';

messageBox.actions.add('Create_new', 'Video_message', {
	id: 'video-message',
	icon: 'video',
	condition: () => (navigator.mediaDevices || navigator.getUserMedia || navigator.webkitGetUserMedia
		|| navigator.mozGetUserMedia || navigator.msGetUserMedia)
		&& window.MediaRecorder
		&& settings.get('FileUpload_Enabled')
		&& settings.get('Message_VideoRecorderEnabled')
		&& (!settings.get('FileUpload_MediaTypeWhiteList')
			|| settings.get('FileUpload_MediaTypeWhiteList').match(/video\/webm|video\/\*/i)),
	action: ({ rid, tmid, messageBox }) => (VRecDialog.opened ? VRecDialog.close() : VRecDialog.open(messageBox, { rid, tmid })),
});

messageBox.actions.add('Add_files_from', 'Computer', {
	id: 'file-upload',
	icon: 'computer',
	condition: () => settings.get('FileUpload_Enabled'),
	action({ rid, tmid, event, messageBox }) {
		event.preventDefault();
		const $input = $(document.createElement('input'));
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
			multiple: 'multiple',
		});

		$(document.body).append($input);

		$input.one('change', function(e) {
			const filesToUpload = [...e.target.files].map((file) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				return {
					file,
					name: file.name,
				};
			});

			fileUpload(filesToUpload, $('.js-input-message', messageBox).get(0), { rid, tmid });
			$input.remove();
		});

		$input.click();

		// Simple hack for iOS aka codegueira
		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
	},
});

messageBox.actions.add('Screen_Sharing', 'Request_Screen_Sharing', {
	id: 'request-screen-sharing',
	icon: 'video',
	condition: () => {
		const rid = Session.get('openedRoom');
		const room = Rooms.findOne({
			_id: rid,
		});

		console.log(room);

		return true;

		// return new Promise((resolve, reject) => {
		// 	resolve(false);
		// });

		// const promise = Promise.resolve(true);
		// const promise = new Promise((resolve, reject) => {
		// 	resolve(true);
		// });
		// promise.then((val) => val);

		// Meteor.call('livechat:getActiveSessionStatus', rid).then((active) => active).then((active) => !active && settings.get('Livechat_enabled') && settings.get('Livechat_screen_sharing_enabled') && room && room.t === 'l');

		// Meteor.call('livechat:getActiveSessionStatus', rid).then((data) => {
		// 	console.log(data);
		// 	return data;
		// });
		// const active = await call('livechat:getActiveSessionStatus', rid);

		// console.log(active);
		// if (active === true) { return 0; }
		// return settings.get('Livechat_enabled') && settings.get('Livechat_screen_sharing_enabled') && room && room.t === 'l';
		// new Promise((resolve, reject) => {
		// 	resolve(true);
		// }).then((bool) => bool);
	},
	action: ({ rid }) => {
		Meteor.call('livechat:requestScreenSharing', rid);
	},
});

messageBox.actions.add('Screen_Sharing', 'End_Screen_Sharing_Session', {
	id: 'end-screen-sharing-session',
	icon: 'video',
	condition: () => true,
	action: ({ rid }) => {
		Meteor.call('livechat:endScreenSharingSession', rid);
	},
});

const geolocation = new ReactiveVar(false);

messageBox.actions.add('Share', 'My_location', {
	id: 'share-location',
	icon: 'map-pin',
	condition: () => geolocation.get() !== false,
	action({ rid, tmid }) {
		const position = geolocation.get();
		const { latitude, longitude } = position.coords;
		const text = `<div class="upload-preview"><div class="upload-preview-file" style="background-size: cover; box-shadow: 0 0 0px 1px #dfdfdf; border-radius: 2px; height: 250px; width:100%; max-width: 500px; background-image:url(https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=500x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ settings.get('MapView_GMapsAPIKey') })" ></div></div>`;

		modal.open({
			title: t('Share_Location_Title'),
			text,
			showCancelButton: true,
			closeOnConfirm: true,
			closeOnCancel: true,
			html: true,
		}, function(isConfirm) {
			if (isConfirm !== true) {
				return;
			}
			Meteor.call('sendMessage', {
				_id: Random.id(),
				rid,
				tmid,
				msg: '',
				location: {
					type: 'Point',
					coordinates: [longitude, latitude],
				},
			});
		});
	},
});

Meteor.startup(() => {
	const handleGeolocation = (position) => geolocation.set(position);
	const handleGeolocationError = () => geolocation.set(false);

	Tracker.autorun(() => {
		const isMapViewEnabled = settings.get('MapView_Enabled') === true;
		const isGeolocationWatchSupported = navigator.geolocation && navigator.geolocation.watchPosition;
		const googleMapsApiKey = settings.get('MapView_GMapsAPIKey');
		const canGetGeolocation =			isMapViewEnabled && isGeolocationWatchSupported && (googleMapsApiKey && googleMapsApiKey.length);

		if (!canGetGeolocation) {
			geolocation.set(false);
			return;
		}

		navigator.geolocation.watchPosition(handleGeolocation, handleGeolocationError, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 10000,
		});
	});
});
