import _ from 'underscore';

RocketChat.TabBar = new (class TabBar {
	constructor() {
		this.buttons = new ReactiveVar({});

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
			btns[config.id].groups = _.union((btns[config.id].groups || []), this.extraGroups[config.id]);
		}

		this.buttons.set(btns);
	}

	removeButton(id) {
		const btns = this.buttons.curValue;
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
		const buttons = _.toArray(this.buttons.get()).filter(button => {
			return !button.condition || button.condition();
		});

		return _.sortBy(buttons, 'order');
	}

	getButton(id) {
		const button = _.findWhere(this.buttons.get(), { id });

		return !button.condition || button.condition();
	}

	addGroup(id, groups) {
		const btns = this.buttons.curValue;
		if (btns[id]) {
			btns[id].groups = _.union((btns[id].groups || []), groups);
			this.buttons.set(btns);
		} else {
			this.extraGroups[id] = _.union((this.extraGroups[id] || []), groups);
		}
	}

	removeGroup(id, groups) {
		const btns = this.buttons.curValue;
		if (btns[id]) {
			btns[id].groups = _.difference((btns[id].groups || []), groups);
			this.buttons.set(btns);
		} else {
			this.extraGroups[id] = _.difference((this.extraGroups[id] || []), groups);
		}
	}
});
