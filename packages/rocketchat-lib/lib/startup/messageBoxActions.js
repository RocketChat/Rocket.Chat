/* globals fileUpload */

import mime from 'mime-type/with-db';

RocketChat.messageBox.actions.add('Create_new', 'Video_message', {
	icon: 'video',
	condition: () => true,
	action() {
		return;
	}
});

RocketChat.messageBox.actions.add('Create_new', 'Audio_message', {
	icon: 'audio',
	condition: () => true,
	action() {
		return;
	}
});

RocketChat.messageBox.actions.add('Add_files_from', 'Computer', {
	icon: 'computer',
	condition: () => RocketChat.settings.get('FileUpload_Enabled'),
	action() {
		const input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		input.setAttribute('multiple', 'multiple');
		document.body.appendChild(input);

		input.click();

		input.addEventListener('change', function(e) {
			const filesToUpload = [...e.target.files].map(file => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name)
				});
				return {
					file,
					name: file.name
				};
			});
			return fileUpload(filesToUpload);
		}, {once: true});

		input.remove();
	}
});

RocketChat.messageBox.actions.add('Share', 'My_location', {
	icon: 'map-pin',
	condition: () => RocketChat.Geolocation.get() !== false,
	action({rid}) {
		const position = RocketChat.Geolocation.get();
		const latitude = position.coords.latitude;
		const longitude = position.coords.longitude;
		const text = `<div class="location-preview"><img style="height: 250px; width: 250px;" src="https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=250x250&markers=color:gray%7Clabel:%7C${ latitude },${ longitude }&key=${ RocketChat.settings.get('MapView_GMapsAPIKey') }" /></div>`;
		return swal({
			title: t('Share_Location_Title'),
			text,
			showCancelButton: true,
			closeOnConfirm: true,
			closeOnCancel: true,
			html: true
		}, function(isConfirm) {
			if (isConfirm !== true) {
				return;
			}
			return Meteor.call('sendMessage', {
				_id: Random.id(),
				rid,
				msg: '',
				location: {
					type: 'Point',
					coordinates: [longitude, latitude]
				}
			});
		});
	}
});
