RocketChat.messageBox = {};

RocketChat.messageBox.actions = new class {
	constructor() {
		this.actions = {};
	}

	/* Add a action to messagebox
	@param group
	@param action name
	@param config
	icon: icon class
	action: action function
	*/

	add(group, actionName, config) {
		if (!group && !actionName && !config) {
			return;
		}

		if (!this.actions[group]) {
			this.actions[group] = [];
		}

		const actionExists = this.actions[group].find((action) => {
			return action.actionName === actionName;
		});

		if (actionExists) {
			return;
		}

		this.actions[group].push({...config, actionName});
	}

	get(group) {
		if (!group) {
			return this.actions;
		}

		return this.actions[group];
	}
};
