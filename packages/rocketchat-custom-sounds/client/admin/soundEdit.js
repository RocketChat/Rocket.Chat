import toastr from 'toastr';
import s from 'underscore.string';

Template.soundEdit.helpers({
	sound() {
		return Template.instance().sound;
	},

	name() {
		return this.name || this._id;
	}
});

Template.soundEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		delete Template.instance().soundFile;
		t.cancel(t.find('form'));
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	},

	'change input[type=file]'(ev) {
		const e = (ev.originalEvent != null) ? ev.originalEvent : ev;
		let files = e.target.files;
		if (e.target.files == null || files.length === 0) {
			if (e.dataTransfer.files != null) {
				files = e.dataTransfer.files;
			} else {
				files = [];
			}
		}

		//using let x of y here seems to have incompatibility with some phones
		for (const file in files) {
			if (files.hasOwnProperty(file)) {
				Template.instance().soundFile = files[file];
			}
		}
	}
});

Template.soundEdit.onCreated(function() {
	if (this.data != null) {
		this.sound = this.data.sound;
	} else {
		this.sound = undefined;
		this.data.tabBar.showGroup('custom-sounds');
	}

	this.cancel = (form, name) => {
		form.reset();
		this.data.tabBar.close();
		if (this.sound) {
			this.data.back(name);
		}
	};

	this.getSoundData = () => {
		const soundData = {};
		if (this.sound != null) {
			soundData._id = this.sound._id;
			soundData.previousName = this.sound.name;
			soundData.extension = this.sound.extension;
			soundData.previousExtension = this.sound.extension;
		}
		soundData.name = s.trim(this.$('#name').val());
		soundData.newFile = false;
		return soundData;
	};

	this.validate = () => {
		const soundData = this.getSoundData();

		const errors = [];
		if (!soundData.name) {
			errors.push('Name');
		}

		if (!soundData._id) {
			if (!this.soundFile) {
				errors.push('Sound_File_mp3');
			}
		}

		for (const error of errors) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		if (this.soundFile) {
			if (!/audio\/mp3/.test(this.soundFile.type)) {
				errors.push('FileType');
				toastr.error(TAPi18n.__('error-invalid-file-type'));
			}
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (this.validate()) {
			const soundData = this.getSoundData();

			if (this.soundFile) {
				soundData.newFile = true;
				soundData.extension = this.soundFile.name.split('.').pop();
				soundData.type = this.soundFile.type;
			}

			Meteor.call('insertOrUpdateSound', soundData, (error, result) => {
				if (result) {
					soundData._id = result;
					soundData.random = Math.round(Math.random() * 1000);

					if (this.soundFile) {
						toastr.info(TAPi18n.__('Uploading_file'));

						const reader = new FileReader();
						reader.readAsBinaryString(this.soundFile);
						reader.onloadend = () => {
							Meteor.call('uploadCustomSound', reader.result, this.soundFile.type, soundData, (uploadError/*, data*/) => {
								if (uploadError != null) {
									handleError(uploadError);
									console.log(uploadError);
									return;
								}
							}
							);
							delete this.soundFile;
							toastr.success(TAPi18n.__('File_uploaded'));
						};
					}

					toastr.success(t('Custom_Sound_Saved_Successfully'));

					this.cancel(form, soundData.name);
				}

				if (error) {
					handleError(error);
				}
			});
		}
	};
});
