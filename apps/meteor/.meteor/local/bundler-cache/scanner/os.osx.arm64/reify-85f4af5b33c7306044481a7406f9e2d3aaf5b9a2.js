module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);
function prettify(context) {
    const { styleManager: { style, pathDescription, link }, printCode, dataPath, error: { params: { format } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const linkInfo = formatLinks[format];
    const linkDescriptions = !linkInfo
        ?
            style.title(`, check the `) +
                link('JSON Schema specification', formatUrl)
        :
            style.title(' according to ') +
                link(linkInfo.title, linkInfo.url) +
                " 📄";
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} is not valid `) +
        style.pathDescription(format) +
        linkDescriptions;
    const codeFrame = printCode('ensure this is ' +
        (linkInfo
            ? 'valid ' + link(linkInfo.title, linkInfo.url)
            : 'a valid ' + style.pathDescription(format)), context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
const formatUrl = 'https://json-schema.org/understanding-json-schema/reference/string.html#format';
const rfcLinks = {
    dateTime: {
        title: 'RFC3339 Section 5.6',
        url: 'https://tools.ietf.org/html/rfc3339#section-5.6',
    },
    email: {
        title: 'RFC5322 Section 3.4.1',
        url: 'https://tools.ietf.org/html/rfc5322#section-3.4.1',
    },
    idnEmail: {
        title: 'RFC6531',
        url: 'https://tools.ietf.org/html/rfc6531',
    },
    hostname: {
        title: 'RFC1034 Section 3.1',
        url: 'https://tools.ietf.org/html/rfc1034#section-3.1',
    },
    idnHostname: {
        title: 'RFC5890 Section 2.3.2.3',
        url: 'https://tools.ietf.org/html/rfc5890#section-2.3.2.3',
    },
    ipv4: {
        title: 'RFC2673 Section 3.2',
        url: 'https://tools.ietf.org/html/rfc2673#section-3.2',
    },
    ipv6: {
        title: 'RFC2373 Section 2.2',
        url: 'https://tools.ietf.org/html/rfc2373#section-2.2',
    },
    uri: {
        title: 'RFC3986',
        url: 'https://tools.ietf.org/html/rfc3986',
    },
    uriReference: {
        title: 'RFC3986 Section 4.1',
        url: 'https://tools.ietf.org/html/rfc3986#section-4.1',
    },
    iri: {
        title: 'RFC3987',
        url: 'https://tools.ietf.org/html/rfc3987',
    },
    uriTemplate: {
        title: 'RFC6570',
        url: 'https://tools.ietf.org/html/rfc6570',
    },
    jsonPointer: {
        title: 'RFC6901',
        url: 'https://tools.ietf.org/html/rfc6901',
    },
    relativeJsonPointer: {
        title: 'Relative JSON Pointers',
        url: 'https://tools.ietf.org/html/draft-handrews-relative-json-pointer-01',
    },
    regex: {
        title: 'ECMA 262',
        url: 'https://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf',
    },
};
const formatLinks = {
    'date-time': rfcLinks.dateTime,
    'time': rfcLinks.dateTime,
    'date': rfcLinks.dateTime,
    email: rfcLinks.email,
    'idn-email': rfcLinks.idnEmail,
    hostname: rfcLinks.hostname,
    'idn-hostname': rfcLinks.idnHostname,
    ipv4: rfcLinks.ipv4,
    ipv6: rfcLinks.ipv6,
    uri: rfcLinks.uri,
    'uri-reference': rfcLinks.uriReference,
    iri: rfcLinks.iri,
    'iri-reference': rfcLinks.iri,
    'uri-template': rfcLinks.uriTemplate,
    'json-pointer': rfcLinks.jsonPointer,
    'relative-json-pointer': rfcLinks.relativeJsonPointer,
    regex: rfcLinks.regex,
};
