import mem from 'mem';

// The link regexes only vary with the configured URL schemes, which come from
// a setting that rarely changes; cache the compiled regexes per schemes value
// instead of recompiling them for every message.
//
// The two parsers intentionally use different patterns: `filtered` only strips
// markup (no URL capture, URLs may contain `)` escapes) while `original`
// renders it (captures the URL, splits image from link).

export const getMarkdownLinkRegexes = mem((schemes) => ({
	image: new RegExp(`!\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\s]+)\\)`, 'gm'),
	link: new RegExp(`\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\s]+)\\)`, 'gm'),
	pipedLink: new RegExp(`(?:<|&lt;)((?:${schemes}):\\/\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'),
}));

export const getFilteredLinkRegexes = mem((schemes) => ({
	link: new RegExp(`!?\\[([^\\]]+)\\]\\((?:${schemes}):\\/\\/[^\\)]+\\)`, 'gm'),
	pipedLink: new RegExp(`(?:<|&lt;)(?:${schemes}):\\/\\/[^\\|]+\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'),
}));
