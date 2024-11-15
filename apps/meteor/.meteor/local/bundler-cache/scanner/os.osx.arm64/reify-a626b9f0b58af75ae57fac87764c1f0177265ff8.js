module.export({default:()=>terminalLink});let ansiEscapes;module.link('ansi-escapes',{default(v){ansiEscapes=v}},0);let supportsHyperlinks;module.link('supports-hyperlinks',{default(v){supportsHyperlinks=v}},1);


function terminalLink(text, url, {target = 'stdout', ...options} = {}) {
	if (!supportsHyperlinks[target]) {
		// If the fallback has been explicitly disabled, don't modify the text itself.
		if (options.fallback === false) {
			return text;
		}

		return typeof options.fallback === 'function' ? options.fallback(text, url) : `${text} (\u200B${url}\u200B)`;
	}

	return ansiEscapes.link(text, url);
}

terminalLink.isSupported = supportsHyperlinks.stdout;
terminalLink.stderr = (text, url, options = {}) => terminalLink(text, url, {target: 'stderr', ...options});
terminalLink.stderr.isSupported = supportsHyperlinks.stderr;
