// <script type="text/javascript">
// 	(function(w, d, s, f) {
// 		w[f] = w[f] || [];
// 		w[f].push(true);
// 		var f = d.getElementsByTagName(s)[0],
// 			j = d.createElement(s);
// 		j.async = true;
// 		j.src = '//localhost:3000/rocket-external.js';
// 		f.parentNode.insertBefore(j, f);
// 	})(window, document, 'script', 'initRocket');
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

	var initRocket = function(start) {
		if (!start) {
			return;
		}

		var chatWidget = document.createElement('div');
		chatWidget.dataset.state = 'closed';
		chatWidget.className = 'rocketchat-widget';
		chatWidget.innerHTML = '<div class="rocketchat-container" style="width:100%;height:100%">' +
								'<iframe src="http://localhost:5000/external" style="width:100%;height:100%;border: 1px solid #E7E7E7;"></iframe> '+
								'</div><div class="rocketchat-overlay"></div>';

		chatWidget.style.position = 'fixed';
		chatWidget.style.width = '300px';
		chatWidget.style.height = '30px';
		chatWidget.style.backgroundColor = '#04436a';
		chatWidget.style.bottom = '0';
		chatWidget.style.right = '50px';

		chatWidget.onclick = function() {
			// konchat.openWindow();
			console.log('clicado');
		};
		document.getElementsByTagName('body')[0].appendChild(chatWidget);
		// document.getElementsByTagName('body')[0].appendChild(chatWindow);

		w.addEventListener('message', function(msg) {
			console.log('new message ->',msg);
			if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
				if (api[msg.data.fn] !== undefined && typeof api[msg.data.fn] === 'function') {
					var args = [].concat(msg.data.args || [])
					api[msg.data.fn].apply(null, args);
				}
			}
		}, false);
	};

	if (typeof w.initRocket !== 'undefined') {
		console.log('w.initRocket ->',w.initRocket);
		initRocket.apply(null, w.initRocket);
	}

	w.initRocket = function(start) {
		initRocket.apply(null, [start]);
	};

	w.initRocket.push = function(start) {
		initRocket.apply(null, [start]);
	};


	return exports;
})(window);
