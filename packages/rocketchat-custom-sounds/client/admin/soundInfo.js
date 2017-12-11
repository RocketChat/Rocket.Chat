Template.soundInfo.helpers({
	name() {
		const sound = Template.instance().sound.get();
		return sound.name;
	},

	sound() {
		return Template.instance().sound.get();
	},

	editingSound() {
		return Template.instance().editingSound.get();
	},

	soundToEdit() {
		const instance = Template.instance();
		return {
			tabBar: instance.data.tabBar,
			data: instance.data.data,
			sound: instance.sound.get(),
			back(name) {
				instance.editingSound.set();

				if (name != null) {
					const sound = instance.sound.get();
					if (sound.name != null && sound.name !== name) {
						return instance.loadedName.set(name);
					}
				}
			}
		};
	}
});

Template.soundInfo.events({
	'click .delete'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const sound = instance.sound.get();
		if (sound != null) {
			const _id = sound._id;
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

						instance.data.tabBar.showGroup('custom-sounds');
						instance.data.tabBar.close();
					}
				});
			});
		}
	},

	'click .edit-sound'(e, instance) {
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
		const data = Template.currentData();
		if (data && data.clear != null) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const sound = this.sound.get();
		if (sound && sound.name != null) {
			this.loadedName.set(sound.name);
		} else if (data.name != null) {
			this.loadedName.set(data.name);
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		this.sound.set(data);
	});
});
