const TurndownService = require('turndown').default;
const turndownService = new TurndownService()
    .addRule("inlineLink", { // this gets rid of title in the links
        filter: function (node, options) {
            return (
                node.nodeName === 'A' &&
                node.getAttribute('href')
            )
        },
    
        replacement: function (content, node) {
            var href = node.getAttribute('href');
            return `[${content}](${href})`;
        }
    });

export const getMarkdownFromHtml = (html: string): string | undefined => {
    return turndownService.turndown(html);
}