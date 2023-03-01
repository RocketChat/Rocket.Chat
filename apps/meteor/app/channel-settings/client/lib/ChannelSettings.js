import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { isTruthy } from '../../../../lib/isTruthy';

export const ChannelSettings = new (class {
	constructor() {
		this.options = new ReactiveVar({});
	}

	/*
	 * Adds an option in Channel Settings
	 * @config (object)
	 *   id: option id (required)
	 *   template (string): template name to render (required)
	 *   validation (function): if option should be displayed
	 */
	addOption(config) {
		if (config == null || config.id == null) {
			return false;
		}
		return Tracker.nonreactive(() => {
			const opts = this.options.get();
			opts[config.id] = config;
			return this.options.set(opts);
		});
	}

	getOptions(currentData = {}, group) {
		return Object.entries(this.options.get())
			.map((option) => {
				const ret = { ...option };
				if (option.validation == null || option.validation(currentData)) {
					ret.data = Object.assign({}, typeof option.data === 'function' ? option.data() : option.data, currentData);
					return ret;
				}

				return null;
			})
			.filter(isTruthy)
			.filter(function (option) {
				return !group || !option.group || option.group.includes(group);
			})
			.sort((a, b) => a.order - b.order);
	}
})();
