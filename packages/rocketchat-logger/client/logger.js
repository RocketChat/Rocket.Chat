import _ from 'underscore';

const Template = Package.templating.Template;

Template.log = false;

Template.logMatch = /.*/;

Template.enableLogs = function(log) {
	Template.logMatch = /.*/;
	if (log === false) {
		return Template.log = false;
	} else {
		Template.log = true;
		if (log instanceof RegExp) {
			return Template.logMatch = log;
		}
	}
};

const wrapHelpersAndEvents = function(original, prefix, color) {
	return function(dict) {

		const template = this;
		const fn1 = function(name, fn) {
			if (fn instanceof Function) {
				return dict[name] = function() {

					const result = fn.apply(this, arguments);
					if (Template.log === true) {
						const completeName = `${ prefix }:${ template.viewName.replace('Template.', '') }.${ name }`;
						if (Template.logMatch.test(completeName)) {
							console.log(`%c${ completeName }`, `color: ${ color }`, {
								args: arguments,
								scope: this,
								result
							});
						}
					}
					return result;
				};
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

const wrapLifeCycle = function(original, prefix, color) {
	return function(fn) {
		const template = this;
		if (fn instanceof Function) {
			const wrap = function() {
				const result = fn.apply(this, arguments);
				if (Template.log === true) {
					const completeName = `${ prefix }:${ template.viewName.replace('Template.', '') }.${ name }`;
					if (Template.logMatch.test(completeName)) {
						console.log(`%c${ completeName }`, `color: ${ color }; font-weight: bold`, {
							args: arguments,
							scope: this,
							result
						});
					}
				}
				return result;
			};
			return original.call(template, wrap);
		} else {
			return original.call(template, fn);
		}
	};
};

Template.prototype.onCreated = wrapLifeCycle(Template.prototype.onCreated, 'onCreated', 'blue');

Template.prototype.onRendered = wrapLifeCycle(Template.prototype.onRendered, 'onRendered', 'green');

Template.prototype.onDestroyed = wrapLifeCycle(Template.prototype.onDestroyed, 'onDestroyed', 'red');
