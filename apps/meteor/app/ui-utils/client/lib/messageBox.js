class MessageBoxActions {
	constructor() {
		this.actions = {};
	}

	add(group, label, config) {
		if (!group && !label && !config) {
			return;
		}

		if (!this.actions[group]) {
			this.actions[group] = [];
		}

		const actionExists = this.actions[group].find((action) => action.label === label);

		if (actionExists) {
			return;
		}

		this.actions[group].push({ ...config, label });
	}

	remove(group, expression) {
		if (!group || !this.actions[group]) {
			return false;
		}

		this.actions[group] = this.actions[group].filter((action) => !expression.test(action.id));
		return this.actions[group];
	}

	get(group) {
		if (!group) {
			return Object.keys(this.actions).reduce((ret, key) => {
				const actions = this.actions[key].filter((action) => !action.condition || action.condition());
				if (actions.length) {
					ret[key] = actions;
				}
				return ret;
			}, {});
		}

		return this.actions[group].filter((action) => !action.condition || action.condition());
	}

	getById(id) {
		const messageActions = this.actions;
		let actions = [];
		Object.keys(messageActions).forEach(function (action) {
			actions = actions.concat(messageActions[action]);
		});

		return actions.filter((action) => action.id === id);
	}
}

export const messageBox = {
	actions: new MessageBoxActions(),
};
