const foregroundColors = {
	30: 'gray',
	31: 'red',
	32: 'lime',
	33: 'yellow',
	34: '#6B98FF',
	35: '#FF00FF',
	36: 'cyan',
	37: 'white',
};

export const ansispan = (str: string): string => {
	str = str
		.replace(/\s/g, '&nbsp;')
		.replace(/(\\n|\n)/g, '<br>')
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;')
		.replace(/(.\d{8}-\d\d:\d\d:\d\d\.\d\d\d\(?.{0,2}\)?)/, '<span>$1</span>')
		.replace(/\033\[1m/g, '<strong>')
		.replace(/\033\[22m/g, '</strong>')
		.replace(/\033\[3m/g, '<em>')
		.replace(/\033\[23m/g, '</em>')
		.replace(/\033\[m/g, '</span>')
		.replace(/\033\[0m/g, '</span>')
		.replace(/\033\[39m/g, '</span>');
	return Object.entries(foregroundColors).reduce((str, [ansiCode, color]) => {
		const span = `<span style="color: ${color}">`;
		return str.replace(new RegExp(`\\033\\[${ansiCode}m`, 'g'), span).replace(new RegExp(`\\033\\[0;${ansiCode}m`, 'g'), span);
	}, str);
};
