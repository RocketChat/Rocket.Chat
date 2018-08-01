import toastr from 'toastr';
import moment from 'moment';
const PersonalAccessTokens = new Mongo.Collection('personal_access_tokens');

Template.personalAccessTokens.helpers({
	isAllowed() {
		return RocketChat.settings.get('API_Enable_Personal_Access_Tokens');
	},
	hasTokens() {
		return Template.instance().tokens.get() && Template.instance().tokens.get().tokens.length > 0;
	},
	tokens() {
		return Template.instance().tokens.get() && Template.instance().tokens.get().tokens || [];
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	}
});

const showSuccessModal = token => {
	modal.open({
		title: t('API_Personal_Access_Token_Generated'),
		text: t('API_Personal_Access_Token_Generated_Text_Token_s_UserId_s', {
			postProcess: 'sprintf',
			sprintf: [token, Meteor.userId()]
		}),
		type: 'success',
		confirmButtonColor: '#DD6B55',
		confirmButtonText: 'Ok',
		closeOnConfirm: true,
		html: true
	}, () => {
	});
};
Template.personalAccessTokens.events({
	'submit #form-tokens'(e, instance) {
		e.preventDefault();
		const tokenName = e.currentTarget.elements['tokenName'].value.trim();
		if (tokenName === '') {
			return toastr.error(t('Please_fill_a_token_name'));
		}
		Meteor.call('personalAccessTokens:generateToken', { tokenName }, (error, token) => {
			if (error) {
				return toastr.error(t(error.error));
			}
			showSuccessModal(token);
			instance.find('#input-token-name').value = '';
		});
	},
	'click .remove-personal-access-token'() {
		modal.open({
			title: t('Are_you_sure'),
			text: t('API_Personal_Access_Tokens_Remove_Modal'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, () => {
			Meteor.call('personalAccessTokens:removeToken', {
				tokenName: this.name
			}, error => {
				if (error) {
					return toastr.error(t(error.error));
				}
				toastr.success(t('Removed'));
			});
		});
	},
	'click .regenerate-personal-access-token'() {
		modal.open({
			title: t('Are_you_sure'),
			text: t('API_Personal_Access_Tokens_Regenerate_Modal'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('API_Personal_Access_Tokens_Regenerate_It'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: true,
			html: false
		}, () => {
			Meteor.call('personalAccessTokens:regenerateToken', {
				tokenName: this.name
			}, (error, token) => {
				if (error) {
					return toastr.error(t(error.error));
				}
				showSuccessModal(token);
			});
		});
	}
});

Template.personalAccessTokens.onCreated(function() {
	this.tokens = new ReactiveVar();
	this.ready = new ReactiveVar(true);

	this.autorun(() => {
		const subscription = this.subscribe('personalAccessTokens');
		this.ready.set(subscription.ready());
		this.tokens.set(PersonalAccessTokens.find().fetch()[0]);
	});
});
