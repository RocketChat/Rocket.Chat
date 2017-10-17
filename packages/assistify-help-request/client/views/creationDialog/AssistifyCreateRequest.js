/* globals TAPi18n, AutoComplete */
import {RocketChat} from 'meteor/rocketchat:lib';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveVar} from 'meteor/reactive-var';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown [name="expertise"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}

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

		if (instance.validExpertise.get()) {
			return '';
		} else {
			return 'disabled';
		}
	}
});

Template.AssistifyCreateRequest.events({
	...acEvents,
	'input #expertise-search'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		if (input.value) {
			t.checkExpertise(input.value);
			t.expertise.set(input.value);
		} else {
			t.validExpertise.set(false);
			t.expertise.set('');
		}
	},
	'submit create-channel__content, click .js-save-request'(event, instance) {
		event.preventDefault();
		const expertise = instance.expertise.get();

		if (expertise) {
			instance.errorMessage.set(null);
			Meteor.call('createRequest', '', expertise, (err, result) => {
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
						default:
							return handleError(err);
					}
				}

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

	this.checkExpertise = _.debounce((expertise) => {
		return Meteor.call('assistify:isValidExpertise', expertise, (error, result) => {
			if (error) {
				instance.validExpertise.set(false);
			} else {
				instance.validExpertise.set(result);
			}
		});
	}, 500);

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
