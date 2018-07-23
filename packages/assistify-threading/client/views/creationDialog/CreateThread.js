/* globals TAPi18n, AutoComplete */
/* globals _ */
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
		t.debounceValidateParentChannel(this.item.name);
	},
	'click .rc-input__icon-svg--book-alt'(e, t) {
		e.preventDefault();
		t.channelSelectionEnabled.set(true);
	},
	'click #more-topics'(e, t) {
		e.preventDefault();
		t.channelSelectionEnabled.set(true);
	},
	'keydown [name="parentChannel"]'(e, t) {
		t.ac.onKeyDown(e);
	},
	'keyup [name="parentChannel"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="parentChannel"]'(e, t) {
		if (t.parentChannel.get() === '' && t.showDropDown.get() === '') {
			t.showDropDown.set('isShowing');
		}
		t.ac.onFocus(e);
	},
	'blur [name="parentChannel"]'(e, t) {
		t.ac.onBlur(e);
		t.debounceValidateParentChannel(e.target.value);
		t.debounceDropDown();
	}
};


Template.CreateThread.helpers({
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		if (!Template.instance().parentChannel.get() && Template.instance().showDropDown.get() === 'isShowing') {
			return true; // show the parentChannel auto complete drop down
		}
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		const instance = Template.instance();
		if (instance.parentChannel.get() === '') {
			if (instance.parentChannelsList.get() && instance.parentChannelsList.get().length <= 10) {
				return instance.parentChannelsList.get();
			}
			// instance.showDropDown.set('');
		}
		return instance.ac.filteredList();
	},
	config() {
		const filter = Template.instance().parentChannel;
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
		return Template.instance().selectParent.get();
	},
	targetChannelText() {
		const instance = Template.instance();
		return `${ TAPi18n.__('Target_channel_prefix') } "${ instance.parentChannel.get() }"`;
	},
	createIsDisabled() {
		const instance = Template.instance();
		if (instance.openingQuestion.get() && instance.parentChannelId.get() && !instance.error.get()) {
			return '';
		} else {
			return 'disabled';
		}
	},
	parentChannelError() {
		const instance = Template.instance();
		return instance.parentChannelError.get();
	},
	parentChannel() {
		const instance = Template.instance();
		return instance.parentChannel.get();
	},
	error() {
		const instance = Template.instance();
		return instance.error.get();
	},
	channelSelectionEnabled() {
		const instance = Template.instance();
		return instance.channelSelectionEnabled.get();
	},
	getWordcloudProperties() {
		const instance = Template.instance();
		const parentChannels = instance.parentChannelsList.get();

		function getRandomArbitrary(min, max) {
			return Math.random() * (max - min) + min;
		}

		function getWordList() {
			const list = [];
			parentChannels.forEach(function(parentChannel) {
				list.push([parentChannel.name, getRandomArbitrary(4, 10)]);
			});
			return list;
		}

		function setParentChannel() {
			return function(selectedparentChannel) {
				const parentChannel = parentChannels.find(parentChannel => parentChannel.name === selectedparentChannel[0]);
				if (parentChannel) {
					instance.debounceWordCloudSelect(parentChannel);
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
			click: setParentChannel(),
			hover: onWordHover()
			//setCanvas: getCanvas
		};
	}

});

Template.CreateThread.events({
	...acEvents,
	'click .js-select-parent'(e, t) {
		t.selectParent.set(true);
	},
	'input #parentChannel-search'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length); t.parentChannel.set(input.value);
		t.parentChannelId.set('');
		t.parentChannelError.set('');
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
		const parentChannel = instance.parentChannel.get();
		const parentChannelId = instance.parentChannelId.get();
		const openingQuestion = instance.openingQuestion.get();
		if (parentChannelId) {
			instance.error.set(null);
			Meteor.call('createThread', parentChannelId, {msg: openingQuestion}, (err, result) => {
				if (err) {
					console.log(err);
					switch (err.error) {
						case 'error-invalid-name':
							instance.error.set(TAPi18n.__('Invalid_room_name', `${ parentChannel }...`));
							return;
						case 'error-duplicate-channel-name':
							instance.error.set(TAPi18n.__('Request_already_exists'));
							return;
						case 'error-archived-duplicate-name':
							instance.error.set(TAPi18n.__('Duplicate_archived_channel_name', name));
							return;
						case 'error-invalid-room-name':
							console.log('room name slug error');
							// 	toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
							instance.error.set(TAPi18n.__('Invalid_room_name', err.details.channel_name));
							return;
						default:
							return handleError(err);
					}
				}
				FlowRouter.goToRoomById(result.rid);
			});
		}
	}
});

Template.CreateThread.onRendered(function() {
	const instance = this;
	const parentChannelElement = this.find('#parentChannel-search');
	const questionElement = this.find('#first_question');

	instance.ac.element = parentChannelElement;
	instance.ac.$element = $(instance.ac.element);
	instance.ac.$element.on('autocompleteselect', function(e, { item }) {
		instance.parentChannel.set(item.name);
		$('input[name="parentChannel"]').val(item.name);
		instance.debounceValidateParentChannel(item.name);
		return instance.find('.js-save-thread').focus();
	});

	if (instance.openingQuestion.get()) {
		questionElement.value = instance.openingQuestion.get();
	}

	// this.autorun(() => {
	// 	instance.debounceWordCloudSelect = _.debounce((parentChannel) => { // TODO: integrate Wordcloud
	// 		/*
	// 		 * Update the parentChannel html reference to autocomplete
	// 		 */
	// 		instance.ac.element = this.find('#parentChannel-search');
	// 		instance.ac.$element = $(instance.ac.element);
	// 		$('input[name="parentChannel"]').val(parentChannel.name); // copy the selected value to screen field
	// 		instance.ac.$element.on('autocompleteselect', function(e, { item }) {
	// 			instance.parentChannel.set(item.name);
	// 			$('input[name="parentChannel"]').val(item.name);
	// 			instance.debounceValidateParentChannel(item.name);

	// 			return instance.find('.js-save-thread').focus();
	// 		});
	// 		instance.parentChannel.set(parentChannel.name);
	// 		instance.debounceValidateParentChannel(parentChannel.name); // invoke validation*/
	// 	}, 200);
	// });
});

Template.CreateThread.onCreated(function() {
	const instance = this;
	instance.parentChannel = new ReactiveVar('general'); // TODO: determine parent Channel from setting and allow to oeverwerite
	instance.selectParent = new ReactiveVar(false);
	instance.parentChannelId = new ReactiveVar('');
	instance.parentChannelError = new ReactiveVar(null);
	instance.error = new ReactiveVar(null);
	instance.openingQuestion = new ReactiveVar('');
	instance.channelSelectionEnabled = new ReactiveVar('');
	instance.showDropDown = new ReactiveVar('');
	instance.parentChannelsList = new ReactiveVar('');
	instance.debounceDropDown = _.debounce(() => {
		instance.showDropDown.set('');
	}, 200);

	instance.debounceValidateParentChannel = _.debounce((parentChannel) => {
		if (!parentChannel) {
			return false; //parentChannel is mandatory
		}
		return Meteor.call('assistify:getParentChannelId', parentChannel, (error, result) => {
			if (error) {
				instance.parentChannelId.set(false);
			} else {
				instance.parentChannelId.set(result);
				if (!result) {
					instance.error.set('parentChannel_does_not_exist');
				} else {
					instance.error.set('');
				}
			}
		});
	}, 500);

	// trigger the validation once
	instance.debounceValidateParentChannel(instance.parentChannel.get());

	this.ac = new AutoComplete({
		selector: {
			item: '.rc-popup-list__item',
			container: '.rc-popup-list__list'
		},
		limit: 10,
		inputDelay: 300,
		rules: [
			{
				collection: 'parentChannelSearch', // TODO:  check for proper collection
				subscription: 'autocompleteparentChannel', // TODO: Provide another subscription exposing `c` and `p`
				field: 'name',
				matchAll: true,
				doNotChangeWidth: false,
				selector(match) {
					return { term: match };
				},
				sort: 'name'
			}
		]

	});
	this.ac.tmplInst = this;

	//pre-fill form based on query parameters if passed - TODO: There has to be another dedicated route to execute this template (except /home)
	// if (FlowRouter.current().queryParams) {
	// 	const parentChannel = FlowRouter.getQueryParam('topic') || FlowRouter.getQueryParam('parentChannel');
	// 	if (parentChannel) {
	// 		instance.parentChannel.set(parentChannel);
	// 		instance.debounceValidateParentChannel(parentChannel);
	// 	}

	// 	const question = FlowRouter.getQueryParam('question');
	// 	if (question) {
	// 		instance.openingQuestion.set(question);
	// 	}
	// }

	// Meteor.call('parentChannelList', { sort: 'name' }, function(err, result) { // TODO: Provide analogous methods
	// 	if (result) {
	// 		instance.parentChannelsList.set(result.channels);
	// 	}
	// });
});
