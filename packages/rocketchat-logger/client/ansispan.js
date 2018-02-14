/* globals ansispan:true */

ansispan = function(str) {
	str = str.replace(/>/g, '&gt;');
	str = str.replace(/</g, '&lt;');

	Object.keys(ansispan.foregroundColors).forEach(function(ansi) {
		const span = `<span style="color: ${ ansispan.foregroundColors[ansi] }">`;

		//
		// `\x1b[Xm` == `\x1b[0;Xm` sets foreground color to `X`.
		//

		str = str.replace(
			new RegExp(`\0o33\\[${ ansi }m`, 'g'),
			span
		).replace(
			new RegExp(`\0o33\\[0;${ ansi }m`, 'g'),
			span
		);
	});
	//
	// `\x1b[1m` enables bold font, `\x1b[22m` disables it
	//
	str = str.replace(/\x1b\[1m/g, '<b>').replace(/\x1b\[22m/g, '</b>');

	//
	// `\x1b[3m` enables italics font, `\x1b[23m` disables it
	//
	str = str.replace(/\x1b\[3m/g, '<i>').replace(/\x1b\[23m/g, '</i>');

	str = str.replace(/\x1b\[m/g, '</span>');
	str = str.replace(/\x1b\[0m/g, '</span>');
	return str.replace(/\x1b\[39m/g, '</span>');
};

ansispan.foregroundColors = {
	'30': 'gray',
	'31': 'red',
	'32': 'lime',
	'33': 'yellow',
	'34': '#6B98FF',
	'35': '#FF00FF',
	'36': 'cyan',
	'37': 'white'
};
