module.exports = (content) => `
var preact = require('preact');
var hooks = require('preact/hooks');
${ content }
var attributes = module.exports.attributes;
var content = module.exports.content;

module.exports = function (props) {
	var ref = hooks.useRef();

	hooks.useEffect(function () {
		var div = document.createElement('div');
		div.innerHTML = '<svg>' + content + '</svg>';

		var source = div.firstChild;
		var dest = ref.current;

		while (source.firstChild) {
			dest && dest.appendChild(source.firstChild);
		}
	}, []);

	return preact.h('svg', Object.assign({ ref: ref }, attributes, props));
};
`;
