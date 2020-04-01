import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

export const TABBAR_DEFAULT_VISIBLE_ICON_COUNT = 6;

export const TabBar = new class TabBar {
	get size() {
		return this._size.get();
	}

	set size(s) {
		this._size.set(s);
	}

	constructor() {
		this.buttons = new ReactiveVar({});
		this._size = new ReactiveVar(TABBAR_DEFAULT_VISIBLE_ICON_COUNT);
		this.extraGroups = {};
	}

	show() {
		$('.flex-tab-bar').show();
	}

	hide() {
		$('.flex-tab-bar').hide();
	}

	addButton(config) {
		if (!config || !config.id) {
			return false;
		}

		const btns = this.buttons.curValue;
		btns[config.id] = config;

		if (this.extraGroups[config.id]) {
			btns[config.id].groups = _.union(btns[config.id].groups || [], this.extraGroups[config.id]);
		}

		// When you add a button with an order value of -1
		// we assume you want to force the visualization of your button
		// so we increase the number of buttons that are shown so you
		// don't end up hiding any of the default ones
		if (config.order === -1) {
			Tracker.nonreactive(() => this.size++);
		}

		this.buttons.set(btns);
	}

	removeButton(id) {
		const btns = this.buttons.curValue;

		// Here we decrease the shown count as your
		// button is no longer present
		if (btns[id] && btns[id].order === -1) {
			Tracker.nonreactive(() => this.size--);
		}

		delete btns[id];

		this.buttons.set(btns);
	}

	updateButton(id, config) {
		const btns = this.buttons.curValue;
		if (btns[id]) {
			btns[id] = _.extend(btns[id], config);
			this.buttons.set(btns);
		}
	}

	getButtons() {
		const buttons = _.toArray(this.buttons.get()).filter((button) => !button.condition || button.condition());

		return _.sortBy(buttons, 'order');
	}

	getButton(id) {
		return _.findWhere(this.buttons.get(), { id });
	}

	addGroup(id, groups) {
		const btns = this.buttons.curValue;
		if (btns[id]) {
			btns[id].groups = _.union(btns[id].groups || [], groups);
			this.buttons.set(btns);
		} else {
			this.extraGroups[id] = _.union(this.extraGroups[id] || [], groups);
		}
	}

	removeGroup(id, groups) {
		const btns = this.buttons.curValue;
		if (btns[id]) {
			btns[id].groups = _.difference(btns[id].groups || [], groups);
			this.buttons.set(btns);
		} else {
			this.extraGroups[id] = _.difference(this.extraGroups[id] || [], groups);
		}
	}
}();
