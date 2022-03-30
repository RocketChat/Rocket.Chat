import { Template } from 'meteor/templating';
import _ from 'underscore';

import { getConfig } from '../../../client/lib/utils/getConfig';

Template.log = !!(getConfig('debug') || getConfig('debug-template'));

if (Template.log) {
	Template.logMatch = /.*/;

	Template.enableLogs = function (log) {
		Template.logMatch = /.*/;
		if (log === false) {
			Template.log = false;
			return false;
		}
		Template.log = true;
		if (log instanceof RegExp) {
			Template.logMatch = log;
			return log;
		}
	};

	const wrapHelpersAndEvents = function (original, prefix, color) {
		return function (dict) {
			const template = this;
			const fn1 = function (name, fn) {
				if (fn instanceof Function) {
					dict[name] = function (...args) {
						const result = fn.apply(this, args);
						if (Template.log === true) {
							const completeName = `${prefix}:${template.viewName.replace('Template.', '')}.${name}`;
							if (Template.logMatch.test(completeName)) {
								console.log(`%c${completeName}`, `color: ${color}`, {
									args,
									scope: this,
									result,
								});
							}
						}
						return result;
					};
					return dict[name];
				}
			};
			_.each(name, (fn, name) => {
				fn1(name, fn);
			});
			return original.call(template, dict);
		};
	};

	Template.prototype.helpers = wrapHelpersAndEvents(Template.prototype.helpers, 'helper', 'blue');

	Template.prototype.events = wrapHelpersAndEvents(Template.prototype.events, 'event', 'green');

	const wrapLifeCycle = function (original, prefix, color) {
		return function (fn) {
			const template = this;
			if (fn instanceof Function) {
				const wrap = function (...args) {
					const result = fn.apply(this, args);
					if (Template.log === true) {
						const completeName = `${prefix}:${template.viewName.replace('Template.', '')}.${name}`;
						if (Template.logMatch.test(completeName)) {
							console.log(`%c${completeName}`, `color: ${color}; font-weight: bold`, {
								args,
								scope: this,
								result,
							});
						}
					}
					return result;
				};
				return original.call(template, wrap);
			}
			return original.call(template, fn);
		};
	};

	Template.prototype.onCreated = wrapLifeCycle(Template.prototype.onCreated, 'onCreated', 'blue');

	Template.prototype.onRendered = wrapLifeCycle(Template.prototype.onRendered, 'onRendered', 'green');

	Template.prototype.onDestroyed = wrapLifeCycle(Template.prototype.onDestroyed, 'onDestroyed', 'red');
}
