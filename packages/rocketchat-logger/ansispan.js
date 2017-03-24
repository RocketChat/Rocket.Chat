/* globals ansispan:true */

ansispan = function(str) {
	str = str.replace(/>/g, '&gt;');
	str = str.replace(/</g, '&lt;');

	Object.keys(ansispan.foregroundColors).forEach(function(ansi) {
		const span = `<span style="color: ${ ansispan.foregroundColors[ansi] }">`;

		//
		// `\033[Xm` == `\033[0;Xm` sets foreground color to `X`.
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
	// `\033[1m` enables bold font, `\033[22m` disables it
	//
	str = str.replace(/\033\[1m/g, '<b>').replace(/\033\[22m/g, '</b>');

	//
	// `\033[3m` enables italics font, `\033[23m` disables it
	//
	str = str.replace(/\033\[3m/g, '<i>').replace(/\033\[23m/g, '</i>');

	str = str.replace(/\033\[m/g, '</span>');
	str = str.replace(/\033\[0m/g, '</span>');
	return str.replace(/\033\[39m/g, '</span>');
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
