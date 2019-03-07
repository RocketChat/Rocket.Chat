import { Meteor } from 'meteor/meteor';
import { roomTypes } from 'meteor/rocketchat:utils';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoComplete } from 'meteor/mizzao:autocomplete';
import { ChatRoom } from 'meteor/rocketchat:models';
import { Blaze } from 'meteor/blaze';
import { call } from 'meteor/rocketchat:ui-utils';

import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import toastr from 'toastr';


Template.CreateThread.helpers({

	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	disabled() {
		if (Template.instance().selectParent.get()) {
			return 'disabled';
		}
	},
	targetChannelText() {
		const instance = Template.instance();
		const parentChannel = instance.parentChannel.get();
		return parentChannel && `${ TAPi18n.__('Thread_target_channel_prefix') } "${ parentChannel }"`;
	},
	createIsDisabled() {
		const instance = Template.instance();
		if (instance.reply.get() && instance.parentChannel.get() && !instance.error.get()) {
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

	selectedUsers() {
		const { message } = this;
		const users = Template.instance().selectedUsers.get();
		if (message) {
			users.unshift(message.u);
		}
		return users;
	},

	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},
	onClickTagRoom() {
		return Template.instance().onClickTagRoom;
	},
	deleteLastItemRoom() {
		return Template.instance().deleteLastItemRoom;
	},
	selectedRoom() {
		return Template.instance().selectedRoom.get();
	},
	onSelectRoom() {
		return Template.instance().onSelectRoom;
	},
	roomCollection() {
		return ChatRoom;
	},
	roomSelector() {
		return (expression) => ({ name: { $regex: `.*${ expression }.*` } });
	},
	roomModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	channelName() {
		return Template.instance().threadName.get();
	},
});

Template.CreateThread.events({
	'input #thread_name'(e, t) {
		t.threadName.set(e.target.value);
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
	'input #thread_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},
	async 'submit create-channel__content, click .js-save-thread'(event, instance) {
		event.preventDefault();
		const parentChannel = instance.parentChannel.get();

		const { pmid } = instance;
		const t_name = instance.threadName.get();
		const users = instance.selectedUsers.get().map(({ username }) => username);

		const prid = instance.parentChannelId.get();
		const reply = instance.reply.get();

		if (!prid) {
			const errorText = TAPi18n.__('Invalid_room_name', `${ parentChannel }...`);

			instance.parentChannelError.set(errorText);
			if (!instance.selectParent.get()) {
				toastr.error(errorText);
			}
			return;
		}
		const result = await call('createThread', { prid, pmid, t_name, reply, users });
		// callback to enable tracking
		Meteor.defer(() => callbacks.run('afterCreateThread', Meteor.user(), result));
		// instance.error.set(null);
		if (instance.data.onCreate) {
			instance.data.onCreate(result);
		}
		roomTypes.openRouteLink(result.t, result);
	},
});

Template.CreateThread.onRendered(function() {
	const instance = this;

	this.find(this.data.rid ? '#thread_name' : '#parentChannel').focus();

	this.autorun(() => {
		instance.debounceWordCloudSelect = _.debounce((parentChannel) => { // integrate Wordcloud
			/*
			* Update the parentChannel html reference to autocomplete
			*/
			instance.acRoom.element = this.find('#parentChannel-search');
			instance.acRoom.$element = $(instance.acRoom.element);
			$('input[name="parentChannel-search"]').val(parentChannel.name); // copy the selected value to screen field
			instance.acRoom.$element.on('autocompleteselect', function(e, { item }) {
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
	const { rid, message: msg } = this.data;
	const instance = this;

	const parentRoom = rid && ChatRoom.findOne(rid);

	// if creating a thread from inside a thread, uses the same channel as parent channel
	const room = parentRoom && parentRoom.prid ? ChatRoom.findOne(parentRoom.prid) : parentRoom;

	if (room) {
		room.text = room.name;
		this.threadName = new ReactiveVar(`${ room.name } - ${ msg && msg.msg }`);
	} else {
		this.threadName = new ReactiveVar('');
	}


	this.pmid = msg && msg._id;

	this.parentChannel = new ReactiveVar(roomTypes.getRoomName(room)); // determine parent Channel from setting and allow to overwrite
	this.parentChannelId = new ReactiveVar(rid);
	this.parentChannelError = new ReactiveVar(null);

	this.selectParent = new ReactiveVar(!!rid);

	this.error = new ReactiveVar(null);
	this.reply = new ReactiveVar('');


	this.selectedRoom = new ReactiveVar(room ? [room] : []);


	this.onClickTagRoom = () => {
		this.selectedRoom.set([]);
	};
	this.deleteLastItemRoom = () => {
		this.selectedRoom.set([]);
	};

	this.onSelectRoom = ({ item: room }) => {
		room.text = room.name;
		this.selectedRoom.set([room]);
	};

	this.autorun(() => {
		const [room = {}] = this.selectedRoom.get();
		this.parentChannel.set(room && room.name); // determine parent Channel from setting and allow to overwrite
		this.parentChannelId.set(room && room._id);
	});


	this.selectedUsers = new ReactiveVar([]);
	this.onSelectUser = ({ item: user }) => {
		this.selectedUsers.set([...this.selectedUsers.get(), user]);
	};
	this.onClickTagUser = (({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get().filter((user) => user.username !== username));
	});
	this.deleteLastItemUser = (() => {
		const arr = this.selectedUsers.get();
		arr.pop();
		this.selectedUsers.set(arr);
	});


	// callback to allow setting a parent Channel or e. g. tracking the event using Piwik or GA
	const callbackDefaults = callbacks.run('openThreadCreationScreen');
	if (callbackDefaults) {
		if (callbackDefaults.parentChannel) {
			this.parentChannel.set(callbackDefaults.parentChannel);
		}
		if (callbackDefaults.reply) {
			this.reply.set(callbackDefaults.reply);
		}
	}

	this.debounceValidateParentChannel = _.debounce((parentChannel) => {
		if (!parentChannel) {
			return false; // parentChannel is mandatory
		}
		return Meteor.call('assistify:getParentChannelId', parentChannel, (error, result) => {
			if (!result) {
				this.parentChannelId.set(false);
				return this.parentChannelError.set(TAPi18n.__('Invalid_room_name', `${ parentChannel }...`));
			}
			this.parentChannelError.set('');
			this.parentChannelId.set(result); // assign parent channel Id
		});
	}, 500);

	// trigger the validation once
	this.debounceValidateParentChannel(this.parentChannel.get());



	// pre-fill form based on query parameters if passed
	if (FlowRouter.current().queryParams) {
		const parentChannel = FlowRouter.getQueryParam('topic') || FlowRouter.getQueryParam('parentChannel');
		if (parentChannel) {
			instance.parentChannel.set(parentChannel);
			instance.debounceValidateParentChannel(parentChannel);
		}

		const question = FlowRouter.getQueryParam('question') || FlowRouter.getQueryParam('message');
		if (question) {
			instance.reply.set(question);
		}
	}
});

Template.SearchCreateThread.helpers({
	list() {
		return this.list;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const { filter } = Template.instance();
		const { noMatchTemplate, templateItem, modifier } = Template.instance().data;
		return {
			filter: filter.get(),
			template_item: templateItem,
			noMatchTemplate,
			modifier(text) {
				return modifier(filter, text);
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.SearchCreateThread.events({
	'input input'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.filter.set(input.value);
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'click .rc-input__icon-svg--book-alt'(e, t) {
		e.preventDefault();
		t.showChannelSelection.set(true);
	},
	'click #more-topics'(e, t) {
		e.preventDefault();
		t.showChannelSelection.set(true);
	},
	'keydown input'(e, t) {
		t.ac.onKeyDown(e);
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const { deleteLastItem } = t;
			return deleteLastItem && deleteLastItem();
		}

	},
	'keyup input'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus input'(e, t) {
		t.ac.onFocus(e);
	},
	'blur input'(e, t) {
		t.ac.onBlur(e);
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});
Template.SearchCreateThread.onRendered(function() {

	const { name } = this.data;

	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchCreateThread.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.deleteLastItem = this.data.deleteLastItem;

	const { collection, subscription, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete(
		{
			selector: {
				anchor: '.rc-input__label',
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
			},
			onSelect,
			position: 'fixed',
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection,
					subscription,
					field,
					matchAll: true,
					// filter,
					doNotChangeWidth: false,
					selector,
					sort,
				},
			],

		});
	this.ac.tmplInst = this;
});
