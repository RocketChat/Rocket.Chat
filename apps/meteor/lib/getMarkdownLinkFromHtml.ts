export const getMarkdownLinkFromHtml = (html: string): string | undefined => {
    var el = document.createElement( 'html' );
    el.innerHTML = html;
    const a = el.getElementsByTagName('a')[0];
    const spans = el.getElementsByTagName('span');
    if (!a || spans.length < 1) {
        return undefined;
    }

    const lastSpan = spans[spans.length - 1];
    if (!lastSpan) {
        return undefined;
    }

    const url = a.getAttribute("href");
    const markdownLink = `[${a.innerText}](${url})${lastSpan.innerText}`;
    return markdownLink;
}