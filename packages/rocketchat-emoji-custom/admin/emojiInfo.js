/* globals isSetNotNull */
Template.emojiInfo.helpers({
	name() {
		let emoji = Template.instance().emoji.get();
		return emoji.name;
	},

	aliases() {
		let emoji = Template.instance().emoji.get();
		return emoji.aliases;
	},

	emoji() {
		return Template.instance().emoji.get();
	},

	editingEmoji() {
		return Template.instance().editingEmoji.get();
	},

	emojiToEdit() {
		let instance = Template.instance();
		return {
			emoji: instance.emoji.get(),
			back(name) {
				instance.editingEmoji.set();

				if (isSetNotNull(() => name)) {
					let emoji = instance.emoji.get();
					if (isSetNotNull(() => emoji.name) && emoji.name !== name) {
						return instance.loadedName.set(name);
					}
				}
			}
		};
	}
});

Template.emojiInfo.events({
	['click .thumb'](e) {
		$(e.currentTarget).toggleClass('bigger');
	},

	['click .delete'](e, instance) {
		e.stopPropagation();
		e.preventDefault();
		let emoji = instance.emoji.get();
		if (isSetNotNull(() => emoji)) {
			let _id = emoji._id;
			swal({
				title: t('Are_you_sure'),
				text: t('Custom_Emoji_Delete_Warning'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_delete_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, function() {
				swal.disableButtons();

				Meteor.call('deleteEmojiCustom', _id, (error/*, result*/) => {
					if (error) {
						handleError(error);
						swal.enableButtons();
					} else {
						swal({
							title: t('Deleted'),
							text: t('Custom_Emoji_Has_Been_Deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false
						});

						RocketChat.TabBar.showGroup('adminEmoji');
						RocketChat.TabBar.closeFlex();
					}
				});
			});
		}
	},

	['click .edit-emoji'](e, instance) {
		e.stopPropagation();
		e.preventDefault();

		instance.editingEmoji.set(instance.emoji.get()._id);
	}
});

Template.emojiInfo.onCreated(function() {
	this.emoji = new ReactiveVar();

	this.editingEmoji = new ReactiveVar();

	this.loadedName = new ReactiveVar();

	this.autorun(() => {
		let data = Template.currentData();
		if (isSetNotNull(() => data.clear)) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		let data = Template.currentData();
		let emoji = this.emoji.get();
		if (isSetNotNull(() => emoji.name)) {
			this.loadedName.set(emoji.name);
		} else if (isSetNotNull(() => data.name)) {
			this.loadedName.set(data.name);
		}
	});

	this.autorun(() => {
		let data = Template.currentData();
		this.emoji.set(data);
	});
});
