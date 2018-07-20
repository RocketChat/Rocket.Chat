/* globals TAPi18n, AutoComplete */
/* globals _ */
import {RocketChat} from 'meteor/rocketchat:lib';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveVar} from 'meteor/reactive-var';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
		t.debounceValidateExpertise(this.item.name);
	},
	'click .rc-input__icon-svg--book-alt'(e, t) {
		e.preventDefault();
		t.channelSelectionEnabled.set(true);
	},
	'click #more-topics'(e, t) {
		e.preventDefault();
		t.channelSelectionEnabled.set(true);
	},
	'keydown [name="expertise"]'(e, t) {
		t.ac.onKeyDown(e);
	},
	'keyup [name="expertise"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="expertise"]'(e, t) {
		if (t.expertise.get() === '' && t.showDropDown.get() === '') {
			t.showDropDown.set('isShowing');
		}
		t.ac.onFocus(e);
	},
	'blur [name="expertise"]'(e, t) {
		t.ac.onBlur(e);
		t.debounceValidateExpertise(e.target.value);
		t.debounceDropDown();
	}
};


Template.CreateThread.helpers({
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		if (!Template.instance().expertise.get() && Template.instance().showDropDown.get() === 'isShowing') {
			return true; // show the expertise auto complete drop down
		}
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		const instance = Template.instance();
		if (instance.expertise.get() === '') {
			if (instance.expertisesList.get() && instance.expertisesList.get().length <= 10) {
				return instance.expertisesList.get();
			}
			// instance.showDropDown.set('');
		}
		return instance.ac.filteredList();
	},
	config() {
		const filter = Template.instance().expertise;
		return {
			filter: filter.get(),
			template_item: 'CreateThreadAutocomplete',
			noMatchTemplate: 'AssistifyTopicSearchEmpty',
			modifier(text) {
				const f = filter.get();
				return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			}
		};
	},
	manuallySelectParent() {
		return false; // TODO: Add logic to overwrite proposed parent Room
	},
	createIsDisabled() {
		const instance = Template.instance();
		if (instance.validExpertise.get() && !instance.titleError.get()) {
			return '';
		} else {
			return 'disabled';
		}
	},
	parentChannelError() {
		const instance = Template.instance();
		return instance.parentChannelError.get();
	},
	expertise() {
		const instance = Template.instance();
		return instance.expertise.get();
	},
	titleError() {
		const instance = Template.instance();
		return instance.titleError.get();
	},
	channelSelectionEnabled() {
		const instance = Template.instance();
		return instance.channelSelectionEnabled.get();
	},
	getWordcloudProperties() {
		const instance = Template.instance();
		const expertises = instance.expertisesList.get();

		function getRandomArbitrary(min, max) {
			return Math.random() * (max - min) + min;
		}

		function getWordList() {
			const list = [];
			expertises.forEach(function(expertise) {
				list.push([expertise.name, getRandomArbitrary(4, 10)]);
			});
			return list;
		}

		function setExpertise() {
			return function(selectedExpertise) {
				const expertise = expertises.find(expertise => expertise.name === selectedExpertise[0]);
				if (expertise) {
					instance.debounceWordCloudSelect(expertise);
				}
				instance.channelSelectionEnabled.set(''); //Search completed.
			};
		}

		function onWordHover() {
			return function(item) {
				// To Do
				return item;

			};
		}

		function setFlatness() {
			return 0.5;
		}

		return {
			clearCanvas: true,
			weightFactor: 8,
			fontWeight: 'normal',
			gridSize: 55,
			shape: 'square',
			rotateRatio: 0,
			rotationSteps: 0,
			drawOutOfBound: true,
			shuffle: true,
			ellipticity: setFlatness(),
			list: getWordList(),
			click: setExpertise(),
			hover: onWordHover()
			//setCanvas: getCanvas
		};
	}

});

Template.CreateThread.events({
	...acEvents,
	'input #expertise-search'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);t.expertise.set(input.value);
		t.validExpertise.set(false);
		t.parentChannelError.set('');
	},
	'input #request_title'(e, t) {
		const input = e.target;
		t.requestTitle.set(input.value);
		if (!input.value) {
			t.titleError.set('');
		} else {
			t.debounceValidateRequestName(input.value);
		}
	},
	'input #first_question'(e, t) {
		const input = e.target;
		if (input.value) {
			t.openingQuestion.set(input.value);
		} else {
			t.openingQuestion.set('');
		}
	},
	'submit create-channel__content, click .js-save-thread'(event, instance) {
		event.preventDefault();
		const expertise = instance.expertise.get();
		const requestTitle = instance.requestTitle.get();
		const openingQuestion = instance.openingQuestion.get();
		if (expertise) {
			instance.titleError.set(null);
			Meteor.call('createRequestFromExpertise', requestTitle, expertise, openingQuestion, (err, result) => {
				if (err) {
					console.log(err);
					switch (err.error) {
						case 'error-invalid-name':
							instance.titleError.set(TAPi18n.__('Invalid_room_name', `${ expertise }...`));
							return;
						case 'error-duplicate-channel-name':
							instance.titleError.set(TAPi18n.__('Request_already_exists'));
							return;
						case 'error-archived-duplicate-name':
							instance.titleError.set(TAPi18n.__('Duplicate_archived_channel_name', name));
							return;
						case 'error-invalid-room-name':
							console.log('room name slug error');
							// 	toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
							instance.titleError.set(TAPi18n.__('Invalid_room_name', err.details.channel_name));
							return;
						default:
							return handleError(err);
					}
				}
				// toastr.success(TAPi18n.__('New_request_created'));
				const roomCreated = RocketChat.models.Rooms.findOne({_id: result.rid});
				FlowRouter.go('request', {name: roomCreated.name}, FlowRouter.current().queryParams);
			});
		}
	}
});

Template.CreateThread.onRendered(function() {
	const instance = this;
	const expertiseElement = this.find('#expertise-search');
	const titleElement = this.find('#request_title');
	const questionElement = this.find('#first_question');

	instance.ac.element = expertiseElement;
	instance.ac.$element = $(instance.ac.element);
	instance.ac.$element.on('autocompleteselect', function(e, {item}) {
		instance.expertise.set(item.name);
		$('input[name="expertise"]').val(item.name);
		instance.debounceValidateExpertise(item.name);
		return instance.find('.js-save-thread').focus();
	});
	if (instance.requestTitle.get()) {
		titleElement.value = instance.requestTitle.get();
	}

	if (instance.openingQuestion.get()) {
		questionElement.value = instance.openingQuestion.get();
	}

	// strategy for setting the focus (yac!)
	if (!expertiseElement.value) {
		Meteor.setTimeout(()=>{
			expertiseElement.focus();
		}, 1500);
	} else if (!questionElement.value) {
		questionElement.focus();
	} else if (!titleElement.value) {
		titleElement.focus();
	} else {
		questionElement.focus();
	}
	this.autorun(() => {
		instance.debounceWordCloudSelect = _.debounce((expertise) => {
			/*
			 * Update the expertise html reference to autocomplete
			 */
			instance.ac.element = this.find('#expertise-search');
			instance.ac.$element = $(instance.ac.element);
			$('input[name="expertise"]').val(expertise.name); // copy the selected value to screen field
			instance.ac.$element.on('autocompleteselect', function(e, {item}) {
				instance.expertise.set(item.name);
				$('input[name="expertise"]').val(item.name);
				instance.debounceValidateExpertise(item.name);

				return instance.find('.js-save-thread').focus();
			});
			instance.expertise.set(expertise.name);
			instance.debounceValidateExpertise(expertise.name); // invoke validation*/
		}, 200);
	});
});

Template.CreateThread.onCreated(function() {
	const instance = this;
	instance.expertise = new ReactiveVar(''); //the value of the text field
	instance.validExpertise = new ReactiveVar(false);
	instance.parentChannelError = new ReactiveVar(null);
	instance.titleError = new ReactiveVar(null);
	instance.requestTitle = new ReactiveVar('');
	instance.openingQuestion = new ReactiveVar('');
	instance.channelSelectionEnabled = new ReactiveVar('');
	instance.showDropDown = new ReactiveVar('');
	instance.expertisesList = new ReactiveVar('');
	instance.debounceDropDown = _.debounce(() => {
		instance.showDropDown.set('');
	}, 200);

	instance.debounceValidateExpertise = _.debounce((expertise) => {
		if (!expertise) {
			return false; //expertise is mandatory
		}
		return Meteor.call('assistify:isValidExpertise', expertise, (error, result) => {
			if (error) {
				instance.validExpertise.set(false);
			} else {
				instance.validExpertise.set(result);
				if (!result) {
					instance.parentChannelError.set('Expertise_does_not_exist');
				} else {
					instance.parentChannelError.set('');
				}
			}
		});
	}, 500);

	instance.debounceValidateRequestName = _.debounce((name) => {
		instance.titleError.set('');
		if (!name) {
			return; //"none" is a valid name
		}
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			Meteor.call('roomDisplayNameExists', name, (error, result) => {
				if (error) {
					return;
				}
				if (result) {
					instance.titleError.set('Request_already_exists');
				}
			});
		} else {
			const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
			const passesRegex = name.length === 0 || reg.test(name);
			if (!passesRegex) {
				instance.titleError.set('Request_no_special_char');
			} else {
				Meteor.call('roomNameExists', name, (error, result) => {
					if (error) {
						return;
					}
					if (result) {
						instance.titleError.set('Request_already_exists');
					}
				});
			}
		}
	}, 500);
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
				subscription: 'autocompleteExpertise', // TODO: Provide another subscription exposing `c` and `p`
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

	//pre-fill form based on query parameters if passed
	if (FlowRouter.current().queryParams) {
		const expertise = FlowRouter.getQueryParam('topic') || FlowRouter.getQueryParam('expertise');
		if (expertise) {
			instance.expertise.set(expertise);
			instance.debounceValidateExpertise(expertise);
		}

		const title = FlowRouter.getQueryParam('title');
		if (title) {
			instance.requestTitle.set(title);
		}

		const question = FlowRouter.getQueryParam('question');
		if (question) {
			instance.openingQuestion.set(question);
		}
	}
	Meteor.call('expertiseList', {sort: 'name'}, function(err, result) {
		if (result) {
			instance.expertisesList.set(result.channels);
		}
	});
});
