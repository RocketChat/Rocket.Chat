import { Meteor } from 'meteor/meteor';
import { roomTypes } from 'meteor/rocketchat:utils';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoComplete } from 'meteor/mizzao:autocomplete';
import { Blaze } from 'meteor/blaze';
import { settings } from 'meteor/rocketchat:settings';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import toastr from 'toastr';
import { handleError } from 'meteor/rocketchat:utils';


const parent = document.querySelector('.main-content');
let oldRoute = '';

/*
	provide a dedicated route to enter the threading creation screen.
	Unfortunately, it is not easily possible to re-use the full-modal-dynamic template:
	If one opens the create *channel* modal and the triggers the thread creation modal,
	the complete application is getting stuck. Thus, we opted for duplicating the code
	and triggering an exclusive modal template.
*/
FlowRouter.route('/create-thread', {
	name: 'create-thread',

	triggersEnter: [function() {
		oldRoute = FlowRouter.current().oldRoute;
	}],

	action() {
		if (parent) {
			Blaze.renderWithData('CreateThread', parent);
		} else {
			BlazeLayout.render('main', { center: 'CreateThread' });
		}
	},

	triggersExit: [function() {
		Blaze.remove(Blaze.getView(document.getElementsByClassName('full-modal')[0]));
		$('.main-content').addClass('rc-old');
	}],
});

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
		t.debounceValidateParentChannel(this.item.name);
	},
	'click .rc-input__icon-svg--book-alt'(e, t) {
		e.preventDefault();
		t.showChannelSelection.set(true);
	},
	'click #more-topics'(e, t) {
		e.preventDefault();
		t.showChannelSelection.set(true);
	},
	'keydown [name="parentChannel"]'(e, t) {
		t.ac.onKeyDown(e);
	},
	'keyup [name="parentChannel"]'(e, t) {
		if (e.target.value === '' && t.showDropDown.get() === '') {
			t.showDropDown.set('isShowing');
		}
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
	},
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
			noMatchTemplate: 'ChannelNotFound',
			modifier(text) {
				const f = filter.get();
				return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			},
		};
	},
	selectParent() {
		return Template.instance().selectParent.get();
	},
	targetChannelText() {
		const instance = Template.instance();
		return `${ TAPi18n.__('Thread_target_channel_prefix') } "${ instance.parentChannel.get() }"`;
	},
	createIsDisabled() {
		const instance = Template.instance();
		if (instance.openingQuestion.get() && instance.parentChannel.get() && !instance.error.get()) {
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
	showChannelSelection() {
		const instance = Template.instance();
		return instance.showChannelSelection.get();
	},
	getWordcloudProperties() {
		const instance = Template.instance();
		const parentChannels = instance.parentChannelsList.get();

		function getSize(/* channel*/) {
			return Math.random() * (4 - 10) + 4;
		}

		function getWordList() {
			const list = [];
			parentChannels.forEach(function(parentChannel) {
				list.push([parentChannel.name, getSize(parentChannel)]);
			});
			return list;
		}

		function setParentChannel() {
			return function(selectedparentChannel) {
				const parentChannel = parentChannels.find((parentChannel) => parentChannel.name === selectedparentChannel[0]);
				if (parentChannel) {
					instance.debounceWordCloudSelect(parentChannel);
				}
				instance.showChannelSelection.set(false); // Search completed.
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
			hover: onWordHover(),
			// setCanvas: getCanvas
		};
	},

	hideWordcloud() {
		const instance = Template.instance();

		const hideMe = function() {
			instance.showChannelSelection.set(false);
		};

		return hideMe;
	},

	selectParentVisibility() {
		const instance = Template.instance();

		return instance.selectParent.get() ? '' : 'hidden';
	},
});

Template.CreateThread.events({
	...acEvents,
	'click .js-select-parent'(e, t) {
		t.selectParent.set(true);
	},
	'input #parentChannel-search'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.parentChannel.set(input.value);
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
		let errorText = '';
		if (parentChannelId) {
			instance.error.set(null);
			Meteor.call('createThread', parentChannelId, {
				msg: openingQuestion,
			}, (err, result) => {
				if (err) {
					console.log(err);
					switch (err.error) {
						case 'error-invalid-name':
							errorText = TAPi18n.__('Invalid_room_name', `${ parentChannel }...`);
							break;
						case 'error-duplicate-channel-name':
							errorText = TAPi18n.__('Request_already_exists');
							break;
						case 'error-archived-duplicate-name':
							errorText = TAPi18n.__('Duplicate_archived_channel_name', name);
							break;
						case 'error-invalid-room-name':
							console.log('room name slug error');
							errorText = TAPi18n.__('Invalid_room_name', err.details.channel_name);
							break;
						default:
							return handleError(err);
					}
				} else {
					// callback to enable tracking
					Meteor.defer(() => {
						callbacks.run('afterCreateThread', Meteor.user(), result);
					});
					roomTypes.openRouteLink(result.t, result);
				}
			});
		} else {
			errorText = TAPi18n.__('Invalid_room_name', `${ parentChannel }...`);
		}

		if (errorText) {
			instance.parentChannelError.set(errorText);
			if (!instance.selectParent.get()) {
				toastr.error(errorText);
			}
		}
	},
	'click .full-modal__back-button'() {
		oldRoute ? history.back() : FlowRouter.go('home');
	},
});

Template.CreateThread.onRendered(function() {
	const instance = this;
	const parentChannelElement = this.find('#parentChannel-search');
	const questionElement = this.find('#first_question');

	questionElement.focus();
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

	this.autorun(() => {
		instance.debounceWordCloudSelect = _.debounce((parentChannel) => { // integrate Wordcloud
			/*
			 * Update the parentChannel html reference to autocomplete
			 */
			instance.ac.element = this.find('#parentChannel-search');
			instance.ac.$element = $(instance.ac.element);
			$('input[name="parentChannel-search"]').val(parentChannel.name); // copy the selected value to screen field
			instance.ac.$element.on('autocompleteselect', function(e, { item }) {
				instance.parentChannel.set(item.name);
				$('input[name="parentChannel-search"]').val(item.name);
				instance.debounceValidateParentChannel(item.name);
				return instance.find('.js-save-thread').focus();
			});
			instance.parentChannel.set(parentChannel.name);
			instance.debounceValidateParentChannel(parentChannel.name); // invoke validation*/
		}, 200);
	});
});

Template.CreateThread.onCreated(function() {
	const instance = this;
	instance.parentChannel = new ReactiveVar(settings.get('Thread_default_parent_Channel')); // determine parent Channel from setting and allow to overwrite
	instance.parentChannelId = new ReactiveVar('');
	instance.parentChannelError = new ReactiveVar(null);
	instance.selectParent = new ReactiveVar(false);
	instance.parentChannelsList = new ReactiveVar('');
	instance.error = new ReactiveVar(null);
	instance.openingQuestion = new ReactiveVar('');
	instance.showDropDown = new ReactiveVar('');
	instance.showChannelSelection = new ReactiveVar(false);
	instance.debounceDropDown = _.debounce(() => {
		instance.showDropDown.set('');
	}, 200);

	// callback to allow setting a parent Channel or e. g. tracking the event using Piwik or GA
	const callbackDefaults = callbacks.run('openThreadCreationScreen');
	if (callbackDefaults) {
		if (callbackDefaults.parentChannel) {
			instance.parentChannel.set(callbackDefaults.parentChannel);
		}
		if (callbackDefaults.openingQuestion) {
			instance.openingQuestion.set(callbackDefaults.openingQuestion);
		}
	}

	instance.debounceValidateParentChannel = _.debounce((parentChannel) => {
		if (!parentChannel) {
			return false; // parentChannel is mandatory
		}
		return Meteor.call('assistify:getParentChannelId', parentChannel, (error, result) => {
			if (!result) {
				instance.parentChannelId.set(false);
				instance.parentChannelError.set(TAPi18n.__('Invalid_room_name', `${ parentChannel }...`));
			} else {
				instance.parentChannelError.set('');
				instance.parentChannelId.set(result); // assign parent channel Id
			}
		});
	}, 500);

	// trigger the validation once
	instance.debounceValidateParentChannel(instance.parentChannel.get());

	instance.ac = new AutoComplete({
		selector: {
			item: '.rc-popup-list__item',
			container: '.rc-popup-list__list',
		},
		limit: 10,
		inputDelay: 300,
		rules: [{
			collection: 'CachedChannelList',
			subscription: 'threadParentAutocomplete',
			field: 'name',
			matchAll: true,
			doNotChangeWidth: false,
			selector(match) {
				return {
					name: match,
				};
			},
			sort: 'name',
		}],
	});
	this.ac.tmplInst = this;

	// pre-fill form based on query parameters if passed
	if (FlowRouter.current().queryParams) {
		const parentChannel = FlowRouter.getQueryParam('topic') || FlowRouter.getQueryParam('parentChannel');
		if (parentChannel) {
			instance.parentChannel.set(parentChannel);
			instance.debounceValidateParentChannel(parentChannel);
		}

		const question = FlowRouter.getQueryParam('question') || FlowRouter.getQueryParam('message');
		if (question) {
			instance.openingQuestion.set(question);
		}
	}

	Meteor.call('getParentChannelList', {
		sort: 'name',
	}, function(err, result) {
		if (result) {
			instance.parentChannelsList.set(result.channels);
		}
	});
});
