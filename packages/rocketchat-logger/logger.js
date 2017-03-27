const Template = Package.templating.Template;

Template.log = false;
Template.logMatch = /.*/;

Template.enableLogs = function(log) {
	Template.logMatch = /.*/;
	Template.log = true;
	if (log === false) {
		return Template.log = false;
	}
	if (log instanceof RegExp) {
		return Template.logMatch = log;
	}
};

const wrapHelpersAndEvents = function(original, prefix, color) {
	return function(dict) {
		const template = this;
		const func = (name, fn) => {
			if (!fn instanceof Function) {
				return;
			}
			return dict[name] = function() {
				const result = fn.apply(this, arguments);
				if (Template.log !== false) {
					return;
				}
				const completeName = prefix + ':' + (template.viewName.replace('Template.', '')) + '.' + name;
				if (!Template.logMatch.test(completeName)) {
					return;
				}
				console.log('%c' + completeName, 'color: ' + color, {
					args: arguments,
					scope: this,
					result
				});
			};
		};
		Object.keys(dict).forEach(key => func(key, dict[key]));
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
				if (Template.log !== true) {
					return;
				}
				const completeName = prefix + ':' + (template.viewName.replace('Template.', ''));
				if (!Template.logMatch.test(completeName)) {
					return;
				}
				console.log('%c' + completeName, 'color: ' + color + '; font-weight: bold', {
					args: arguments,
					scope: this,
					result: result
				});
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
