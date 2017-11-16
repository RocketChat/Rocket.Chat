/* globals TAPi18n, AutoComplete */
import {RocketChat} from 'meteor/rocketchat:lib';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveVar} from 'meteor/reactive-var';
import toastr from 'toastr';

const validateRequestName = (name) => {
	if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
		return true;
	} else {
		const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
		return name.length === 0 || reg.test(name);
	}
};

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown [name="expertise"]'(e, t) {
		t.ac.onKeyDown(e);
	},
	'keyup [name="expertise"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="expertise"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="expertise"]'(e, t) {
		t.ac.onBlur(e);
	}
};


Template.AssistifyCreateRequest.helpers({
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	errorMessage() {
		return Template.instance().errorMessage.get();
	},
	config() {
		const filter = Template.instance().expertise;
		return {
			filter: filter.get(),
			template_item: 'AssistifyCreateRequestAutocomplete',
			noMatchTemplate: 'userSearchEmpty',
			modifier(text) {
				const f = filter.get();
				return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			}
		};
	},
	createIsDisabled() {
		const instance = Template.instance();

		if (!instance.requestTitle.get()) {
			if (instance.validExpertise.get()) {
				return '';
			} else {
				return 'disabled';
			}
		} else if (instance.requestTitle.get()) {
			if (instance.validExpertise.get() && !instance.requestTitleInUse.get() && !instance.invalidTitle.get()) {
				return '';
			} else {
				return 'disabled';
			}
		}
	},
	invalidTitle() {
		const instance = Template.instance();
		return instance.invalidTitle.get();
	},
	requestTitleInUse() {
		const instance = Template.instance();
		return instance.requestTitleInUse.get();
	},
	validExpertise() {
		const instance = Template.instance();
		return instance.validExpertise.get();
	},
	expertise() {
		const instance = Template.instance();
		return instance.expertise.get();
	},
	requestTitleError() {
		const instance = Template.instance();
		return instance.invalidTitle.get() || instance.requestTitleInUse.get();
	}
	// noSplCharAllowed() {
	// 	const instance = Template.instance();
	// 	return instance.noSplCharAllowed.get();
	// }
});


Template.AssistifyCreateRequest.events({
	...acEvents,
	'input #expertise-search'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		if (input.value) {
			t.delaySetExpertise(input.value);
			t.checkExpertise(input.value);
		} else {
			t.delaySetExpertise(false);
			t.expertise.set('');
		}
		if (t.expertise.get() && t.requestTitle.get()) {
			const requestName = `${ t.expertise.get() }-${ t.requestTitle.get() }`;
			t.invalidTitle.set(!validateRequestName(requestName));
			t.requestTitleInUse.set(undefined);
			t.checkRequestName(requestName);
		}
	},
	'input #request_title'(e, t) {
		const input = e.target;
		//const length = input.value.length;
		if (input.value !== t.requestTitle.get()) {
			t.requestTitle.set(input.value);
		} else {
			t.requestTitle.set(false);
		}

		if (t.expertise.get() && input.value) {
			const requestName = `${ input.value }`;
			t.invalidTitle.set(!validateRequestName(requestName));
			if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
				t.checkRequestDisplayName(requestName);
			} else {
				t.checkRequestName(requestName);
			}
			// t.invalidTitle.set(!validateRequestName(requestName));
			// t.checkRequestName(requestName);
			t.requestTitleInUse.set(undefined);
		} else if (!input.value) {
			t.invalidTitle.set(false);
			t.requestTitleInUse.set(undefined);
		}

	},
	'input #first_question'(e, t) {
		const input = e.target;
		//const length = input.value.length;
		if (input.value) {
			t.openingQuestion.set(input.value);
		} else {
			t.openingQuestion.set(false);
		}
	},
	'submit create-channel__content, click .js-save-request'(event, instance) {
		event.preventDefault();
		const expertise = instance.expertise.get();
		const requestTitle = instance.requestTitle.get();
		const openingQuestion = instance.openingQuestion.get();
		if (expertise) {
			instance.errorMessage.set(null);
			Meteor.call('createRequest', requestTitle, expertise, openingQuestion, (err, result) => {
				if (err) {
					console.log(err);
					switch (err.error) {
						case 'error-invalid-name':
							toastr.error(TAPi18n.__('Invalid_room_name', `${ expertise }...`));
							return;
						case 'error-duplicate-channel-name':
							toastr.error(TAPi18n.__('Request_already_exists'));
							return;
						case 'error-archived-duplicate-name':
							toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
							return;
						case 'error-invalid-room-name':
							console.log('room name slug error');
							// 	toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
							toastr.error(TAPi18n.__('Invalid_room_name', err.details.channel_name));
							return;
						default:
							return handleError(err);
					}
				}
				console.log('Room Created');
				toastr.success(TAPi18n.__('New_request_created'));
				const roomCreated = RocketChat.models.Rooms.findOne({_id: result.rid});
				FlowRouter.go('request', {name: roomCreated.name}, FlowRouter.current().queryParams);
			});
		} else {
			instance.validExpertise.set(true);
		}
	}
});

Template.AssistifyCreateRequest.onRendered(function() {
	const instance = this;
	this.find('input[name="expertise"]').focus();
	this.ac.element = this.find('input[name="expertise"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		instance.expertise.set(item.name);
		$('input[name="expertise"]').val(item.name);
		instance.checkExpertise(item.name);

		return instance.find('.js-save-request').focus();
	});
});

Template.AssistifyCreateRequest.onCreated(function() {
	const instance = this;

	instance.expertise = new ReactiveVar(''); //the value of the text field
	instance.validExpertise = new ReactiveVar(false);
	instance.errorMessage = new ReactiveVar(null);
	instance.requestTitle = new ReactiveVar('');
	instance.openingQuestion = new ReactiveVar('');
	instance.requestTitleInUse = new ReactiveVar(undefined);
	instance.invalidTitle = new ReactiveVar(false);
	instance.error = new ReactiveVar(null);
	instance.checkRequestName = _.debounce((name) => {
		if (validateRequestName(name)) {
			return Meteor.call('roomNameExists', name, (error, result) => {
				if (error) {
					return;
				}
				instance.requestTitleInUse.set(result);
			});
		}
		instance.requestTitleInUse.set(undefined);
	}, 500);
	instance.checkRequestDisplayName = _.debounce((name) => {
		if (validateRequestName(name)) {
			return Meteor.call('roomDisplayNameExists', name, (error, result) => {
				if (error) {
					return;
				}
				instance.requestTitleInUse.set(result);
			});
		}
		instance.requestTitleInUse.set(undefined);
	}, 500);
	instance.checkExpertise = _.debounce((expertise) => {
		return Meteor.call('assistify:isValidExpertise', expertise, (error, result) => {
			if (error) {
				instance.validExpertise.set(false);
			} else {
				instance.validExpertise.set(result);
			}
		});
	}, 500);
	instance.delaySetExpertise = _.debounce((expertise) => {
		instance.expertise.set(expertise);
	}, 200);

	// instance.clearForm = function() {
	// 	instance.requestRoomName.set('');
	// 	instance.expertise.set('');
	// 	instance.find('#expertise-search').value = '';
	// };

	this.ac = new AutoComplete({
		selector: {
			item: '.rc-popup-list__item',
			container: '.rc-popup-list__list'
		},
		limit: 10,
		inputDelay: 300,
		rules: [
			{
				// @TODO maybe change this 'collection' and/or template
				collection: 'expertiseSearch',
				subscription: 'autocompleteExpertise',
				field: 'name',
				matchAll: true,
				doNotChangeWidth: false,
				selector(match) {
					return {term: match};
				},
				sort: 'name'
			}
		]

	});
	this.ac.tmplInst = this;
});
