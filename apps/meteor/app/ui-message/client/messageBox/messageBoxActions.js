import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { VRecDialog } from '../../../ui-vrecord/client';
import { messageBox } from '../../../ui-utils';
import { fileUpload } from '../../../ui';
import { settings } from '../../../settings';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import ShareLocationModal from '../../../../client/views/room/ShareLocation/ShareLocationModal';

messageBox.actions.add('Create_new', 'Video_message', {
	id: 'video-message',
	icon: 'video',
	condition: () =>
		(navigator.mediaDevices ||
			navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia) &&
		window.MediaRecorder &&
		settings.get('FileUpload_Enabled') &&
		settings.get('Message_VideoRecorderEnabled') &&
		(!settings.get('FileUpload_MediaTypeBlackList') || !settings.get('FileUpload_MediaTypeBlackList').match(/video\/webm|video\/\*/i)) &&
		(!settings.get('FileUpload_MediaTypeWhiteList') || settings.get('FileUpload_MediaTypeWhiteList').match(/video\/webm|video\/\*/i)),
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

		$input.one('change', async function (e) {
			const { mime } = await import('../../../utils/lib/mimeTypes');
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

const canGetGeolocation = new ReactiveVar(false);

messageBox.actions.add('Share', 'My_location', {
	id: 'share-location',
	icon: 'map-pin',
	condition: () => canGetGeolocation.get(),
	async action({ rid, tmid }) {
		imperativeModal.open({ component: ShareLocationModal, props: { rid, tmid, onClose: imperativeModal.close } });
	},
});

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isMapViewEnabled = settings.get('MapView_Enabled') === true;
		const isGeolocationCurrentPositionSupported = navigator.geolocation && navigator.geolocation.getCurrentPosition;
		const googleMapsApiKey = settings.get('MapView_GMapsAPIKey');
		canGetGeolocation.set(isMapViewEnabled && isGeolocationCurrentPositionSupported && googleMapsApiKey && googleMapsApiKey.length);
	});
});
