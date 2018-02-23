Template.emojiInfo.helpers({
	name() {
		const emoji = Template.instance().emoji.get();
		return emoji.name;
	},

	aliases() {
		const emoji = Template.instance().emoji.get();
		return emoji.aliases;
	},

	emoji() {
		return Template.instance().emoji.get();
	},

	editingEmoji() {
		return Template.instance().editingEmoji.get();
	},

	emojiToEdit() {
		const instance = Template.instance();
		return {
			tabBar: this.tabBar,
			emoji: instance.emoji.get(),
			back(name) {
				instance.editingEmoji.set();

				if (name != null) {
					const emoji = instance.emoji.get();
					if (emoji != null && emoji.name != null && emoji.name !== name) {
						return instance.loadedName.set(name);
					}
				}
			}
		};
	}
});

Template.emojiInfo.events({
	'click .thumb'(e) {
		$(e.currentTarget).toggleClass('bigger');
	},

	'click .delete'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const emoji = instance.emoji.get();
		if (emoji != null) {
			const _id = emoji._id;
			modal.open({
				title: t('Are_you_sure'),
				text: t('Custom_Emoji_Delete_Warning'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, function() {
				Meteor.call('deleteEmojiCustom', _id, (error/*, result*/) => {
					if (error) {
						return handleError(error);
					} else {
						modal.open({
							title: t('Deleted'),
							text: t('Deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false
						});

						instance.tabBar.close();
					}
				});
			});
		}
	},

	'click .edit-emoji'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		instance.editingEmoji.set(instance.emoji.get()._id);
	}
});

Template.emojiInfo.onCreated(function() {
	this.emoji = new ReactiveVar();

	this.editingEmoji = new ReactiveVar();

	this.loadedName = new ReactiveVar();

	this.tabBar = Template.currentData().tabBar;

	this.autorun(() => {
		const data = Template.currentData();
		if (data != null && data.clear != null) {
			this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const emoji = this.emoji.get();
		if (emoji != null && emoji.name != null) {
			this.loadedName.set(emoji.name);
		} else if (data != null && data.name != null) {
			this.loadedName.set(data.name);
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		this.emoji.set(data);
	});
});
