import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

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
		const allOptions = _.toArray(this.options.get());
		const allowedOptions = _.compact(
			_.map(allOptions, function (option) {
				const ret = { ...option };
				if (option.validation == null || option.validation(currentData)) {
					ret.data = Object.assign({}, typeof option.data === 'function' ? option.data() : option.data, currentData);
					return ret;
				}
			}),
		).filter(function (option) {
			return !group || !option.group || option.group.includes(group);
		});
		return _.sortBy(allowedOptions, 'order');
	}
})();
