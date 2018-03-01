/*!
 * EventEmitter v5.1.0 - git.io/ee
 * Unlicense - http://unlicense.org/
 * Oliver Caldwell - http://oli.me.uk/
 * @preserve
 */
(function(exports) {
	'use strict';

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size
	var proto = EventEmitter.prototype;
	var originalGlobalValue = exports.EventEmitter;

	/**
	 * Finds the index of the listener for the event in its storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (evt instanceof RegExp) {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		} else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	function isValidListener(listener) {
		if (typeof listener === 'function' || listener instanceof RegExp) {
			return true;
		} else if (listener && typeof listener === 'object') {
			return isValidListener(listener.listener);
		} else {
			return false;
		}
	}

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		if (!isValidListener(listener)) {
			throw new TypeError('listener must be a function');
		}

		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after its first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the first argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the first argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of its properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					} else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		} else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		} else if (evt instanceof RegExp) {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		} else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Alias of removeEvent.
	 *
	 * Added to mirror the node API.
	 */
	proto.removeAllListeners = alias('removeEvent');

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listenersMap = this.getListenersAsObject(evt);
		var listeners;
		var listener;
		var i;
		var key;
		var response;

		for (key in listenersMap) {
			if (listenersMap.hasOwnProperty(key)) {
				listeners = listenersMap[key].slice(0);

				for (i = 0; i < listeners.length; i++) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		} else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	/**
	 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
	 *
	 * @return {Function} Non conflicting EventEmitter class.
	 */
	EventEmitter.noConflict = function noConflict() {
		exports.EventEmitter = originalGlobalValue;
		return EventEmitter;
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof module === 'object' && module.exports) {
		module.exports = EventEmitter;
	} else {
		exports.EventEmitter = EventEmitter;
	}
}(this || {}));

/* globals EventEmitter */

(function(w) {
	w.RocketChat = w.RocketChat || { _: [] };
	var config = {};
	var widget;
	var iframe;
	var hookQueue = [];
	var ready = false;
	var smallScreen = false;
	var bodyStyle;
	var scrollPosition;

	var widgetWidth = '320px';
	var widgetHeightOpened = '350px';
	var widgetHeightClosed = '30px';

	var validCallbacks = [
		'chat-maximized',
		'chat-minimized',
		'chat-started',
		'chat-ended',
		'pre-chat-form-submit',
		'offline-form-submit'
	];
	var callbacks = new EventEmitter();

	var registerCallback = function(eventName, fn) {
		if (validCallbacks.indexOf(eventName) === -1) {
			return false;
		}

		return callbacks.on(eventName, fn);
	};

	var emitCallback = function(eventName, data) {
		if (typeof data !== 'undefined') {
			callbacks.emit(eventName, data);
		} else {
			callbacks.emit(eventName);
		}
	};

	// hooks
	var callHook = function(action, params) {
		if (!ready) {
			return hookQueue.push(arguments);
		}
		var data = {
			src: 'rocketchat',
			fn: action,
			args: params
		};
		iframe.contentWindow.postMessage(data, '*');
	};

	var closeWidget = function() {
		if (widget.dataset.state === 'closed') {
			return;
		}

		if (smallScreen) {
			document.body.style.cssText = bodyStyle;
			document.body.scrollTop = scrollPosition;
		}

		widget.dataset.state = 'closed';
		widget.style.height = widgetHeightClosed;
		callHook('widgetClosed');

		emitCallback('chat-minimized');
	};

	var openWidget = function() {
		if (widget.dataset.state === 'opened') {
			return;
		}

		if (smallScreen) {
			scrollPosition = document.body.scrollTop;
			bodyStyle = document.body.style.cssText;
			document.body.style.cssText += 'overflow: hidden; height: 100%; width: 100%; position: fixed; top:' + scrollPosition + 'px;';
		}

		widget.dataset.state = 'opened';
		widget.style.height = widgetHeightOpened;
		callHook('widgetOpened');
		document.querySelector('.rocketchat-widget iframe').focus();

		emitCallback('chat-maximized');
	};

	var api = {
		ready: function() {
			ready = true;
			if (hookQueue.length > 0) {
				hookQueue.forEach(function(hookParams) {
					callHook.apply(this, hookParams);
				});
				hookQueue = [];
			}
		},
		toggleWindow: function(/*forceClose*/) {
			if (widget.dataset.state === 'closed') {
				openWidget();
			} else {
				closeWidget();
			}
		},
		openPopout: function() {
			closeWidget();
			var popup = window.open(config.url + '?mode=popout', 'livechat-popout', 'width=400, height=450, toolbars=no');
			popup.focus();
		},
		openWidget: function() {
			openWidget();
		},
		removeWidget: function() {
			document.getElementsByTagName('body')[0].removeChild(widget);
		},
		callback: function(eventName, data) {
			emitCallback(eventName, data);
		}
	};

	var pageVisited = function(change) {
		callHook('pageVisited', {
			change: change,
			location: JSON.parse(JSON.stringify(document.location)),
			title: document.title
		});
	};

	var setCustomField = function(key, value, overwrite) {
		if (typeof overwrite === 'undefined') {
			overwrite = true;
		}
		callHook('setCustomField', [key, value, overwrite]);
	};

	var setTheme = function(theme) {
		callHook('setTheme', theme);
	};

	var setDepartment = function(department) {
		callHook('setDepartment', department);
	};

	var clearDepartment = function() {
		callHook('clearDepartment');
	};

	var currentPage = {
		href: null,
		title: null
	};
	var trackNavigation = function() {
		setInterval(function() {
			if (document.location.href !== currentPage.href) {
				pageVisited('url');
				currentPage.href = document.location.href;
			}
			if (document.title !== currentPage.title) {
				pageVisited('title');
				currentPage.title = document.title;
			}
		}, 800);
	};

	var init = function(url) {
		if (!url) {
			return;
		}

		config.url = url;

		var chatWidget = document.createElement('div');
		chatWidget.dataset.state = 'closed';
		chatWidget.className = 'rocketchat-widget';
		chatWidget.innerHTML = '<div class="rocketchat-container" style="width:100%;height:100%">' +
			'<iframe id="rocketchat-iframe" src="' + url + '" style="width:100%;height:100%;border:none;background-color:transparent" allowTransparency="true" allow="microphone; camera"></iframe> ' +
			'</div><div class="rocketchat-overlay"></div>';

		chatWidget.style.position = 'fixed';
		chatWidget.style.width = widgetWidth;
		chatWidget.style.height = widgetHeightClosed;
		chatWidget.style.borderTopLeftRadius = '5px';
		chatWidget.style.borderTopRightRadius = '5px';
		chatWidget.style.bottom = '0';
		chatWidget.style.right = '50px';
		chatWidget.style.zIndex = '12345';

		document.getElementsByTagName('body')[0].appendChild(chatWidget);

		widget = document.querySelector('.rocketchat-widget');
		iframe = document.getElementById('rocketchat-iframe');

		w.addEventListener('message', function(msg) {
			if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
				if (api[msg.data.fn] !== undefined && typeof api[msg.data.fn] === 'function') {
					var args = [].concat(msg.data.args || []);
					api[msg.data.fn].apply(null, args);
				}
			}
		}, false);

		var mediaqueryresponse = function(mql) {
			if (mql.matches) {
				smallScreen = true;
				chatWidget.style.left = '0';
				chatWidget.style.right = '0';
				chatWidget.style.width = '100%';
			} else {
				chatWidget.style.left = 'auto';
				chatWidget.style.right = '50px';
				chatWidget.style.width = widgetWidth;
			}
		};

		var mql = window.matchMedia('screen and (max-device-width: 480px)');
		mediaqueryresponse(mql);
		mql.addListener(mediaqueryresponse);

		// track user navigation
		trackNavigation();
	};

	if (typeof w.initRocket !== 'undefined') {
		console.warn('initRocket is now deprecated. Please update the livechat code.');
		init(w.initRocket[0]);
	}

	if (typeof w.RocketChat.url !== 'undefined') {
		init(w.RocketChat.url);
	}

	var queue = w.RocketChat._;

	w.RocketChat = w.RocketChat._.push = function(c) {
		c.call(w.RocketChat.livechat);
	};

	// exports
	w.RocketChat.livechat = {
		// methods
		pageVisited: pageVisited,
		setCustomField: setCustomField,
		setTheme: setTheme,
		setDepartment: setDepartment,
		clearDepartment: clearDepartment,

		// callbacks
		onChatMaximized: function(fn) { registerCallback('chat-maximized', fn); },
		onChatMinimized: function(fn) { registerCallback('chat-minimized', fn); },
		onChatStarted: function(fn) { registerCallback('chat-started', fn); },
		onChatEnded: function(fn) { registerCallback('chat-ended', fn); },
		onPrechatFormSubmit: function(fn) { registerCallback('pre-chat-form-submit', fn); },
		onOfflineFormSubmit: function(fn) { registerCallback('offline-form-submit', fn); }
	};

	// proccess queue
	queue.forEach(function(c) {
		c.call(w.RocketChat.livechat);
	});
}(window));
