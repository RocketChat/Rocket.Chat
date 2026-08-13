/**
 * Port of meteorhacks:inject-initial (with Rocket.Chat's rawModHtml patch):
 * registers payloads/transforms to apply to the served client HTML.
 *
 * With the vite-built client, whatever serves index.html must run
 * `applyHtmlInjections(html, req, res)` before responding — the middleware
 * hook Meteor provided does not exist here.
 */

type HtmlMod = (html: string, req?: unknown, res?: unknown) => string | Promise<string>;

const rawHeads = new Map<string, string>();
const rawBodies = new Map<string, string>();
const htmlMods = new Map<string, HtmlMod>();

export const Inject = {
	rawHead(id: string, content: string): void {
		rawHeads.set(id, content);
	},

	rawBody(id: string, content: string): void {
		rawBodies.set(id, content);
	},

	rawModHtml(id: string, mod: HtmlMod): void {
		htmlMods.set(id, mod);
	},
};

export const applyHtmlInjections = async (html: string, req?: unknown, res?: unknown): Promise<string> => {
	if (rawHeads.size) {
		html = html.replace('</head>', `${[...rawHeads.values()].join('\n')}\n</head>`);
	}
	if (rawBodies.size) {
		html = html.replace('</body>', `${[...rawBodies.values()].join('\n')}\n</body>`);
	}
	for (const mod of htmlMods.values()) {
		html = await mod(html, req, res);
	}
	return html;
};
