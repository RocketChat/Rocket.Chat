(function(w) {
	w.RocketChat = w.RocketChat || { _: [] };
	var config = {};
	var widget;
	var iframe;
	var hookQueue = [];
	var ready = false;

	var closeWidget = function() {
		widget.dataset.state = 'closed';
		widget.style.height = '30px';
	};

	var openWidget = function() {
		widget.dataset.state = 'opened';
		widget.style.height = '300px';
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
		}
	};

	var pageVisited = function() {
		callHook('pageVisited', {
			location: JSON.parse(JSON.stringify(document.location)),
			title: document.title
		});
	};

	var setCustomField = function(key, value) {
		callHook('setCustomField', [ key, value ]);
	};

	var currentPage = {
		href: null,
		title: null
	};
	var trackNavigation = function() {
		setInterval(function() {
			if (document.location.href !== currentPage.href) {
				pageVisited();

				currentPage.href = document.location.href;
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
								'<iframe id="rocketchat-iframe" src="' + url + '" style="width:100%;height:100%;border:none;background-color:transparent" allowTransparency="true"></iframe> '+
								'</div><div class="rocketchat-overlay"></div>';

		chatWidget.style.position = 'fixed';
		chatWidget.style.width = '300px';
		chatWidget.style.height = '30px';
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

		var mediaqueryresponse = function (mql) {
			if (mql.matches) {
				chatWidget.style.left = '0';
				chatWidget.style.right = '0';
				chatWidget.style.width = '100%';
			} else {
				chatWidget.style.left = 'auto';
				chatWidget.style.right = '50px';
				chatWidget.style.width = '300px';
			}
		};

		var mql = window.matchMedia('screen and (max-device-width: 480px) and (orientation: portrait)');
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
		pageVisited: pageVisited,
		setCustomField: setCustomField
	};

	// proccess queue
	queue.forEach(function(c) {
		c.call(w.RocketChat.livechat);
	});
}(window));
