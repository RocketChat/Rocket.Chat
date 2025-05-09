/* eslint-disable no-control-regex */
const foregroundColors = {
	30: 'var(--rcx-color-font-secondary-info, #6C727A)',
	31: 'var(--rcx-color-font-danger, #D40C26)',
	32: 'var(--rcx-color-status-font-on-success, #148660)',
	33: 'var(--rcx-color-status-font-on-warning, #B88D00)',
	34: 'var(--rcx-color-status-font-on-info, #095AD2)',
	35: 'var(--rcx-color-status-font-on-service-2, #7F1B9F)',
	36: 'teal',
	37: 'var(--rcx-color-font-white, #FFFFFF)',
};

export const ansispan = (str: string): string => {
	str = str
		.replace(/\s/g, '&nbsp;')
		.replace(/(\\n|\n)/g, '<br>')
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;')
		.replace(/(.\d{8}-\d\d:\d\d:\d\d\.\d\d\d\(?.{0,2}\)?)/, '<span>$1</span>')
		.replace(/\x1b\[1m/g, '<strong>')
		.replace(/\x1b\[22m/g, '</strong>')
		.replace(/\x1b\[3m/g, '<em>')
		.replace(/\x1b\[23m/g, '</em>')
		.replace(/\x1b\[m/g, '</span>')
		.replace(/\x1b\[0m/g, '</span>')
		.replace(/\x1b\[39m/g, '</span>');
	return Object.entries(foregroundColors).reduce((str, [ansiCode, color]) => {
		const span = `<span style="color: ${color}">`;
		return str.replace(new RegExp(`\\033\\[${ansiCode}m`, 'g'), span).replace(new RegExp(`\\033\\[0;${ansiCode}m`, 'g'), span);
	}, str);
};
