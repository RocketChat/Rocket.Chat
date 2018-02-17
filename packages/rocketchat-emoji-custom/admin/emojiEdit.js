import toastr from 'toastr';
import s from 'underscore.string';

Template.emojiEdit.helpers({
	emoji() {
		return Template.instance().emoji;
	},

	name() {
		return this.name || this._id;
	}
});

Template.emojiEdit.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		delete Template.instance().emojiFile;
		t.cancel(t.find('form'));
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	},

	'change input[type=file]'(ev) {
		const e = ev.originalEvent != null ? ev.originalEvent : ev;
		let files = e.target.files;
		if (files == null || files.length === 0) {
			if (e.dataTransfer != null && e.dataTransfer.files != null) {
				files = e.dataTransfer.files;
			} else {
				files = [];
			}
		}

		//using let x of y here seems to have incompatibility with some phones
		for (const file in files) {
			if (files.hasOwnProperty(file)) {
				Template.instance().emojiFile = files[file];
			}
		}
	}
});

Template.emojiEdit.onCreated(function() {
	if (this.data != null) {
		this.emoji = this.data.emoji;
	} else {
		this.emoji = undefined;
	}

	this.tabBar = Template.currentData().tabBar;

	this.cancel = (form, name) => {
		form.reset();
		this.tabBar.close();
		if (this.emoji) {
			this.data.back(name);
		}
	};

	this.getEmojiData = () => {
		const emojiData = {};
		if (this.emoji != null) {
			emojiData._id = this.emoji._id;
			emojiData.previousName = this.emoji.name;
			emojiData.extension = this.emoji.extension;
			emojiData.previousExtension = this.emoji.extension;
		}
		emojiData.name = s.trim(this.$('#name').val());
		emojiData.aliases = s.trim(this.$('#aliases').val());
		emojiData.newFile = false;
		return emojiData;
	};

	this.validate = () => {
		const emojiData = this.getEmojiData();

		const errors = [];
		if (!emojiData.name) {
			errors.push('Name');
		}

		if (!emojiData._id) {
			if (!this.emojiFile) {
				errors.push('Image');
			}
		}

		for (const error of errors) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		if (this.emojiFile) {
			if (!/image\/.+/.test(this.emojiFile.type)) {
				errors.push('FileType');
				toastr.error(TAPi18n.__('error-invalid-file-type'));
			}
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (this.validate()) {
			const emojiData = this.getEmojiData();

			if (this.emojiFile) {
				emojiData.newFile = true;
				emojiData.extension = this.emojiFile.name.split('.').pop();
			}

			Meteor.call('insertOrUpdateEmoji', emojiData, (error, result) => {
				if (result) {
					if (this.emojiFile) {
						toastr.info(TAPi18n.__('Uploading_file'));

						const reader = new FileReader();
						reader.readAsBinaryString(this.emojiFile);
						reader.onloadend = () => {
							Meteor.call('uploadEmojiCustom', reader.result, this.emojiFile.type, emojiData, (uploadError/*, data*/) => {
								if (uploadError != null) {
									handleError(uploadError);
									console.log(uploadError);
									return;
								}
							}
							);
							delete this.emojiFile;
							toastr.success(TAPi18n.__('File_uploaded'));
						};
					}

					if (emojiData._id) {
						toastr.success(t('Custom_Emoji_Updated_Successfully'));
					} else {
						toastr.success(t('Custom_Emoji_Added_Successfully'));
					}

					this.cancel(form, emojiData.name);
				}

				if (error) {
					handleError(error);
				}
			});
		}
	};
});
