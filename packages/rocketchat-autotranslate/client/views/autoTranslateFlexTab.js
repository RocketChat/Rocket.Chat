/* globals ChatSubscription */
import toastr from 'toastr';

Template.autoTranslateFlexTab.helpers({
	autoTranslate() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				autoTranslate: 1
			}
		});
		return sub && sub.autoTranslate ? true : false;
	},

	autoTranslateValue() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				autoTranslate: 1
			}
		});
		return sub && sub.autoTranslate ? t('True') : t('False');
	},

	autoTranslateLanguage() {
		const sub = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		}, {
			fields: {
				autoTranslateLanguage: 1
			}
		});
		const autoTranslateLanguage = sub && sub.autoTranslateLanguage;
		const supportedLanguages = Template.instance().supportedLanguages.get();
		const language = _.findWhere(supportedLanguages, { language: autoTranslateLanguage });
		return language && (language.name || language.language) || autoTranslateLanguage;
	},

	editing(field) {
		return Template.instance().editing.get() === field;
	},

	supportedLanguages() {
		return Template.instance().supportedLanguages.get();
	}
});

Template.autoTranslateFlexTab.onCreated(function() {
	this.editing = new ReactiveVar();
	this.supportedLanguages = new ReactiveVar([]);
	const userLanguage = Meteor.user().language || window.defaultUserLanguage();
	Meteor.call('autoTranslate.getSupportedLanguages', userLanguage, (err, languages) => {
		this.supportedLanguages.set(languages || []);
	});

	this.validateSetting = (field) => {
		const value = this.$('select[name='+ field +']').val();
		switch (field) {
			case 'autoTranslate':
				if (['', '1'].indexOf(value) === -1) {
					toastr.error(t('Invalid_setting_s'), value || '');
					return false;
				}
				return true;
			case 'autoTranslateLanguage':
				if (!_.findWhere(this.supportedLanguages.get(), { language: value })) {
					toastr.error(t('Invalid_setting_s', value || ''));
					return false;
				}
				return true;
		}
	};

	this.saveSetting = () => {
		const field = this.editing.get();
		const value = this.$('select[name='+field+']').val();
		if (this.validateSetting(field)) {
			Meteor.call('autoTranslate.saveSettings', Session.get('openedRoom'), field, value, (err/*, result*/) => {
				if (err) {
					return handleError(err);
				}
				this.editing.set();
			});
		}
	};
});

Template.autoTranslateFlexTab.events({
	'keydown input[type=text]'(e, instance) {
		if (e.keyCode === 13) {
			e.preventDefault();
			instance.saveSetting();
		}
	},

	'click [data-edit]'(e, instance) {
		e.preventDefault();
		instance.editing.set($(e.currentTarget).data('edit'));
		setTimeout(function() { instance.$('input.editing').focus().select(); }, 100);
	},

	'click .cancel'(e, instance) {
		e.preventDefault();
		instance.editing.set();
	},

	'click .save'(e, instance) {
		e.preventDefault();
		instance.saveSetting();
	}
});
