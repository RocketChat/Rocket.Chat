// <script type="text/javascript">
// 	(function(w, d, s, f, u) {
// 		w[f] = (w[f] || []).push(u);
// 		var h = d.getElementsByTagName(s)[0],
// 			j = d.createElement(s);
// 		j.async = true;
// 		j.src = 'rocket-livechat.js';
// 		h.parentNode.insertBefore(j, h);
// 	})(window, document, 'script', 'initRocket', 'http://localhost:5000/livechat');
// </script>

;(function(w) {
	var exports = {};

	var api = {
		toggleWindow: function() {
			var widget = document.querySelector('.rocketchat-widget');
			if (widget.dataset.state === 'closed') {
				widget.dataset.state = 'opened';
				widget.style.height = '300px';
			} else {
				widget.dataset.state = 'closed';
				widget.style.height = '30px';
			}
		}
	};

	var initRocket = function(url) {
		if (!url) {
			return;
		}

		var chatWidget = document.createElement('div');
		chatWidget.dataset.state = 'closed';
		chatWidget.className = 'rocketchat-widget';
		chatWidget.innerHTML = '<div class="rocketchat-container" style="width:100%;height:100%">' +
								'<iframe src="' + url + '" style="width:100%;height:100%;border:none;background-color:transparent" allowTransparency="true"></iframe> '+
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

		w.addEventListener('message', function(msg) {
			if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
				if (api[msg.data.fn] !== undefined && typeof api[msg.data.fn] === 'function') {
					var args = [].concat(msg.data.args || [])
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
	};

	if (typeof w.initRocket !== 'undefined') {
		initRocket.apply(null, w.initRocket);
	}

	w.initRocket = function(url) {
		initRocket.apply(null, [url]);
	};

	w.initRocket.push = function(url) {
		initRocket.apply(null, [url]);
	};

	return exports;
})(window);
