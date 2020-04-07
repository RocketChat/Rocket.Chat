import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { AutoComplete } from '../../../../../../app/meteor-autocomplete/client';
import { hasAllPermission } from '../../../../../../app/authorization/client';
import { messageContext } from '../../../../../../app/ui-utils/client/lib/messageContext';
import { call, convertDate, scrollTo } from '../../utils.js';

import './audit.html';

const loadMessages = async function({ rid, users, startDate, endDate = new Date(), msg }) {
	this.messages = this.messages || new ReactiveVar([]);
	this.loading = this.loading || new ReactiveVar(true);
	try {
		this.loading.set(true);
		const messages = await call('auditGetMessages', { rid, users, startDate, endDate, msg });
		this.messagesContext.set({
			...messageContext({ rid }),
			messages,
		});
	} catch (e) {
		this.messagesContext.set({});
	} finally {
		this.loading.set(false);
	}
};

Template.audit.events({
	'submit form'(e) {
		e.preventDefault();
	},
	'change input[type=date]'(e) {
		e.currentTarget.parentElement.parentElement.parentElement.classList.remove('rc-input--error');
	},
	'change [name=type]'(e, t) {
		t.type.set(e.currentTarget.value);
	},
	async 'click .js-submit'(e, t) {
		const form = e.currentTarget.parentElement;

		const result = {};

		e.currentTarget.blur();

		if (t.type.get() === 'd') {
			if (!t.users) {
				return form.querySelector('#autocomplete-users').classList.add('rc-input--error');
			}
			form.querySelector('#autocomplete-users').classList.remove('rc-input--error');
			result.users = t.users.map((user) => user.username);
		} else {
			if (!t.room || !t.room._id) {
				return form.querySelector('#autocomplete-room').classList.add('rc-input--error');
			}
			form.querySelector('#autocomplete-room').classList.remove('rc-input--error');
			result.rid = t.room._id;
		}

		if (!form.startDate.value) {
			return form.startDate.parentElement.parentElement.parentElement.classList.add('rc-input--error');
		}
		form.startDate.parentElement.parentElement.parentElement.classList.remove('rc-input--error');
		result.startDate = form.startDate.type === 'date' ? convertDate(form.startDate.value) : form.startDate.value;


		result.msg = form.msg.value;

		if (!form.endDate.value) {
			return form.endDate.parentElement.parentElement.parentElement.classList.add('rc-input--error');
		}
		form.endDate.parentElement.parentElement.parentElement.classList.remove('rc-input--error');
		result.endDate = form.endDate.type === 'date' ? convertDate(form.endDate.value) : form.endDate.value;
		result.endDate = new Date(result.endDate.getTime() + 86400000);

		await t.loadMessages(result);

		setTimeout(() => {
			const offset = $(document.querySelector('.rc-audit-container ul')).offset();
			if (!offset) {
				return;
			}
			scrollTo(document.querySelector('.rc-audit-container'), offset.top - 150, 300);
		}, 150);
	},
});

Template.audit.helpers({
	onChange() {
		const that = Template.instance();
		return function(value, key) {
			that[key] = value;
		};
	},
	prepareRoom: () => function(room) {
		room.username = room.name;
		return room;
	},
	modifierUser: () => function(text, filter) {
		const f = filter.get();
		return `@${ f.length === 0 ? text : text.replace(new RegExp(f), function(part) {
			return `<strong>${ part }</strong>`;
		}) }`;
	},
	nTypeD() {
		return Template.instance().type.get() !== 'd';
	},
	typeD() {
		return Template.instance().type.get() === 'd';
	},
	type() {
		return Template.instance().type.get();
	},
	isLoading() {
		return Template.instance().loading.get();
	},
	messageContext() {
		return Template.instance().messagesContext.get();
	},
	hasResults() {
		return Template.instance().hasResults.get();
	},
});

Template.audit.onCreated(async function() {
	this.messagesContext = new ReactiveVar({});
	this.type = new ReactiveVar();
	this.loading = new ReactiveVar(false);
	this.hasResults = new ReactiveVar(false);

	if (!hasAllPermission('can-audit')) {
		return FlowRouter.go('/home');
	}

	this.autorun(() => {
		const messagesContext = this.messagesContext.get();

		this.hasResults.set(messagesContext && messagesContext.messages && messagesContext.messages.length > 0);
	});

	this.loadMessages = loadMessages.bind(this);
});

const acEvents = (key/* , variable, name*/) => ({
	'click .rc-popup-list__item'(e, t) {
		t[key].onItemClick(this, e);
	},
	'keydown input'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selected;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}
		t[key].onKeyDown(e);
	},
	'keyup input'(e, t) {
		t[key].onKeyUp(e);
	},
	'focus input'(e, t) {
		t[key].onFocus(e);
	},
	'blur input'(e, t) {
		t[key].onBlur(e);
	},
});

Template.auditAutocompleteDirectMessage.events({
	...acEvents('ac', 'selected'),
	'input input'(e, t) {
		t.filter.set(e.target.value);
	},
	'click .rc-tags__tag-icon'(e, t) {
		t.selected.set();
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});

Template.auditAutocomplete.events({
	...acEvents('ac', 'selected'),
	'input input'(e, t) {
		t.filter.set(e.target.value);
	},
	'click .rc-tags__tag-icon'(e, t) {
		t.selected.set();
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});

Template.auditAutocompleteDirectMessage.helpers({
	selected() {
		const instance = Template.instance();
		const selected = instance.selected.get();
		return selected && (instance.data.prepare ? instance.data.prepare(selected) : selected);
	},
	config() {
		const { filter } = Template.instance();
		return {
			template_item: 'popupList_item_channel',
			// noMatchTemplate: Template.roomSearchEmpty,
			filter: filter.get(),
			noMatchTemplate: 'userSearchEmpty',
			modifier: (text) => (Template.parentData(8).modifier || function(text, filter) {
				const f = filter.get();
				return `#${ f.length === 0 ? text : text.replace(new RegExp(f), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			})(text, filter),
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
});

Template.auditAutocomplete.helpers({
	selected() {
		const instance = Template.instance();
		const selected = instance.selected.get();
		return selected && (instance.data.prepare ? instance.data.prepare(selected) : selected);
	},
	config() {
		const { filter } = Template.instance();
		return {
			template_item: 'popupList_item_channel',
			// noMatchTemplate: Template.roomSearchEmpty,
			filter: filter.get(),
			noMatchTemplate: 'userSearchEmpty',
			modifier: (text) => (Template.parentData(8).modifier || function(text, filter) {
				const f = filter.get();
				return `#${ f.length === 0 ? text : text.replace(new RegExp(f), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			})(text, filter),
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
});

Template.auditAutocomplete.onRendered(async function() {
	const { selected } = this;

	this.ac.element = this.firstNode.querySelector('input');
	this.ac.$element = $(this.ac.element);

	this.ac.$element.on('autocompleteselect', function(e, { item }) {
		selected.set(item);
	});
});

Template.auditAutocomplete.helpers({
	selected() {
		const instance = Template.instance();
		const selected = instance.selected.get();
		return selected && (instance.data.prepare ? instance.data.prepare(selected) : selected);
	},
	config() {
		const { filter } = Template.instance();
		return {
			template_item: 'popupList_item_channel',
			// noMatchTemplate: Template.roomSearchEmpty,
			filter: filter.get(),
			noMatchTemplate: 'userSearchEmpty',
			modifier: (text) => (Template.parentData(8).modifier || function(text, filter) {
				const f = filter.get();
				return `#${ f.length === 0 ? text : text.replace(new RegExp(f), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			})(text, filter),
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
});

const autocompleteConfig = ({
	collection,
	endpoint,
	field,
	term = 'term',
}) => ({
	selector: {
		item: '.rc-popup-list__item',
		container: '.rc-popup-list__list',
	},

	limit: 10,
	inputDelay: 300,
	rules: [{
		// @TODO maybe change this 'collection' and/or template
		collection,
		endpoint,
		field,
		matchAll: true,
		selector(match) {
			return {
				[term]: match,
			};
		},
		sort: field,
	}],
});

Template.auditAutocomplete.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar('');

	this.onClickTag = () => {
		this.selected.set('');
	};

	this.autorun(() => {
		const value = this.selected.get();
		this.data.onChange(value, this.data.key);
	});
	this.ac = new AutoComplete(autocompleteConfig({
		field: this.data.field,
		collection: this.data.collection || 'CachedChannelList',
		endpoint: this.data.endpoint || 'rooms.autocomplete.channelAndPrivate',
		term: this.data.term || 'term',
	}));
	this.ac.tmplInst = this;
});


Template.auditAutocompleteDirectMessage.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);

	this.onClickTag = ({ username }) => {
		this.selected.set(this.selected.get().filter((user) => user.username !== username));
	};

	this.autorun(() => {
		const value = this.selected.get();
		this.data.onChange(value, this.data.key);
	});
	this.ac = new AutoComplete(autocompleteConfig({
		field: this.data.field,
		collection: this.data.collection || 'CachedChannelList',
		endpoint: this.data.endpoint || 'rooms.autocomplete.channelAndPrivate',
		term: this.data.term || 'term',
	}));
	this.ac.tmplInst = this;
});

Template.auditAutocompleteDirectMessage.onRendered(async function() {
	const { selected } = this;

	this.ac.element = this.firstNode.querySelector('input');
	this.ac.$element = $(this.ac.element);

	this.ac.$element.on('autocompleteselect', function(e, { item }) {
		selected.set([...selected.get(), item]);
	});
});
