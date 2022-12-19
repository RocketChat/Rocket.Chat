import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { VRecDialog } from '../../../ui-vrecord/client';
import { messageBox } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import ShareLocationModal from '../../../../client/views/room/ShareLocation/ShareLocationModal';
import { Rooms } from '../../../models/client';

messageBox.actions.add('Create_new', 'Video_message', {
	id: 'video-message',
	icon: 'video',
	condition: () =>
		navigator.mediaDevices &&
		window.MediaRecorder &&
		settings.get('FileUpload_Enabled') &&
		settings.get('Message_VideoRecorderEnabled') &&
		(!settings.get('FileUpload_MediaTypeBlackList') || !settings.get('FileUpload_MediaTypeBlackList').match(/video\/webm|video\/\*/i)) &&
		(!settings.get('FileUpload_MediaTypeWhiteList') || settings.get('FileUpload_MediaTypeWhiteList').match(/video\/webm|video\/\*/i)) &&
		window.MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus'),
	action: ({ rid, tmid, messageBox, chat }) => {
		VRecDialog.opened ? VRecDialog.close() : VRecDialog.open(messageBox, { rid, tmid, chat });
	},
});

messageBox.actions.add('Add_files_from', 'Computer', {
	id: 'file-upload',
	icon: 'computer',
	condition: () => settings.get('FileUpload_Enabled'),
	action({ event, chat }) {
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
			const filesToUpload = Array.from(e.target.files ?? []).map((file) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				return file;
			});

			chat?.flows.uploadFiles(filesToUpload);
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
	condition: () => {
		const room = Rooms.findOne(Session.get('openedRoom'));
		if (!room) {
			return false;
		}
		return canGetGeolocation.get() && !isRoomFederated(room);
	},
	async action({ rid, tmid }) {
		imperativeModal.open({ component: ShareLocationModal, props: { rid, tmid, onClose: imperativeModal.close } });
	},
});

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isMapViewEnabled = settings.get('MapView_Enabled') === true;
		const isGeolocationCurrentPositionSupported = Boolean(navigator.geolocation?.getCurrentPosition);
		const googleMapsApiKey = settings.get('MapView_GMapsAPIKey');
		canGetGeolocation.set(isMapViewEnabled && isGeolocationCurrentPositionSupported && googleMapsApiKey && googleMapsApiKey.length);
	});
});
