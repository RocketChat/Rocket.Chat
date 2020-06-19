import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { AutoComplete } from '../../../../meteor-autocomplete/client';
import './livechatAutocompleteUser.html';

Template.livechatAutocompleteUser.helpers({
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
	label() {
		const instance = Template.instance();
		return instance.showLabel && instance.label;
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.livechatAutocompleteUser.events({
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
		return onClickTag && onClickTag(Blaze.getData(target));
	},
});

Template.livechatAutocompleteUser.onRendered(function() {
	const { name } = this.data;

	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
	this.deleteLastItem = this.data.deleteLastItem;
});

Template.livechatAutocompleteUser.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.showLabel = this.data.showLabel;
	this.label = this.data.label;

	const filter = {};
	this.autorun(() => {
		const { exceptions, conditions } = Template.currentData();
		filter.exceptions = exceptions;
		filter.conditions = conditions;
	});

	const { collection, endpoint, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete({
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
				filter,
				collection,
				endpoint,
				field,
				matchAll: true,
				doNotChangeWidth: false,
				selector,
				sort,
			},
		],
	});
	this.ac.tmplInst = this;
});
