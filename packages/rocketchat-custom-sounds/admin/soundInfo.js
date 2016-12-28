/* globals isSetNotNull */
Template.soundInfo.helpers({
	name() {
		let sound = Template.instance().sound.get();
		return sound.name;
	},

	sound() {
		return Template.instance().sound.get();
	},

	editingSound() {
		return Template.instance().editingSound.get();
	},

	soundToEdit() {
		let instance = Template.instance();
		return {
			sound: instance.sound.get(),
			back(name) {
				instance.editingSound.set();

				if (isSetNotNull(() => name)) {
					let sound = instance.sound.get();
					if (isSetNotNull(() => sound.name) && sound.name !== name) {
						return instance.loadedName.set(name);
					}
				}
			}
		};
	}
});

Template.soundInfo.events({
	['click .delete'](e, instance) {
		e.stopPropagation();
		e.preventDefault();
		let sound = instance.sound.get();
		if (isSetNotNull(() => sound)) {
			let _id = sound._id;
			swal({
				title: t('Are_you_sure'),
				text: t('Custom_Sound_Delete_Warning'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_delete_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, function() {
				swal.disableButtons();

				Meteor.call('deleteCustomSound', _id, (error/*, result*/) => {
					if (error) {
						handleError(error);
						swal.enableButtons();
					} else {
						swal({
							title: t('Deleted'),
							text: t('Custom_Sound_Has_Been_Deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false
						});

						RocketChat.TabBar.showGroup('adminSounds');
						RocketChat.TabBar.closeFlex();
					}
				});
			});
		}
	},

	['click .edit-sound'](e, instance) {
		e.stopPropagation();
		e.preventDefault();

		instance.editingSound.set(instance.sound.get()._id);
	}
});

Template.soundInfo.onCreated(function() {
	this.sound = new ReactiveVar();

	this.editingSound = new ReactiveVar();

	this.loadedName = new ReactiveVar();

	this.autorun(() => {
		let data = Template.currentData();
		if (isSetNotNull(() => data.clear)) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		let data = Template.currentData();
		let sound = this.sound.get();
		if (isSetNotNull(() => sound.name)) {
			this.loadedName.set(sound.name);
		} else if (isSetNotNull(() => data.name)) {
			this.loadedName.set(data.name);
		}
	});

	this.autorun(() => {
		let data = Template.currentData();
		this.sound.set(data);
	});
});
