module.export({fromBodyLegacy:function(){return fromBodyLegacy},isBody:function(){return isBody},getBody:function(){return getBody}});var IncomingRequestMessage;module.link("./incoming-request-message",{IncomingRequestMessage:function(v){IncomingRequestMessage=v}},0);var IncomingResponseMessage;module.link("./incoming-response-message",{IncomingResponseMessage:function(v){IncomingResponseMessage=v}},1);var OutgoingRequestMessage;module.link("./outgoing-request-message",{OutgoingRequestMessage:function(v){OutgoingRequestMessage=v}},2);


// If the Content-Disposition header field is missing, bodies of
// Content-Type application/sdp imply the disposition "session", while
// other content types imply "render".
// https://tools.ietf.org/html/rfc3261#section-13.2.1
function contentTypeToContentDisposition(contentType) {
    if (contentType === "application/sdp") {
        return "session";
    }
    else {
        return "render";
    }
}
/**
 * Create a Body given a legacy body type.
 * @param bodyLegacy - Body Object
 * @internal
 */
function fromBodyLegacy(bodyLegacy) {
    const content = typeof bodyLegacy === "string" ? bodyLegacy : bodyLegacy.body;
    const contentType = typeof bodyLegacy === "string" ? "application/sdp" : bodyLegacy.contentType;
    const contentDisposition = contentTypeToContentDisposition(contentType);
    const body = { contentDisposition, contentType, content };
    return body;
}
/**
 * User-Defined Type Guard for Body.
 * @param body - Body to check.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBody(body) {
    return body &&
        typeof body.content === "string" &&
        typeof body.contentType === "string" &&
        body.contentDisposition === undefined
        ? true
        : typeof body.contentDisposition === "string";
}
/**
 * Given a message, get a normalized body.
 * The content disposition is inferred if not set.
 * @param message - The message.
 * @internal
 */
function getBody(message) {
    let contentDisposition;
    let contentType;
    let content;
    // We're in UAS role, receiving incoming request
    if (message instanceof IncomingRequestMessage) {
        if (message.body) {
            // FIXME: Parsing needs typing
            const parse = message.parseHeader("Content-Disposition");
            contentDisposition = parse ? parse.type : undefined;
            contentType = message.parseHeader("Content-Type");
            content = message.body;
        }
    }
    // We're in UAC role, receiving incoming response
    if (message instanceof IncomingResponseMessage) {
        if (message.body) {
            // FIXME: Parsing needs typing
            const parse = message.parseHeader("Content-Disposition");
            contentDisposition = parse ? parse.type : undefined;
            contentType = message.parseHeader("Content-Type");
            content = message.body;
        }
    }
    // We're in UAC role, sending outgoing request
    if (message instanceof OutgoingRequestMessage) {
        if (message.body) {
            contentDisposition = message.getHeader("Content-Disposition");
            contentType = message.getHeader("Content-Type");
            if (typeof message.body === "string") {
                // FIXME: OutgoingRequest should not allow a "string" body without a "Content-Type" header.
                if (!contentType) {
                    throw new Error("Header content type header does not equal body content type.");
                }
                content = message.body;
            }
            else {
                // FIXME: OutgoingRequest should not allow the "Content-Type" header not to match th body content type
                if (contentType && contentType !== message.body.contentType) {
                    throw new Error("Header content type header does not equal body content type.");
                }
                contentType = message.body.contentType;
                content = message.body.body;
            }
        }
    }
    // We're in UAS role, sending outgoing response
    if (isBody(message)) {
        contentDisposition = message.contentDisposition;
        contentType = message.contentType;
        content = message.content;
    }
    // No content, no body.
    if (!content) {
        return undefined;
    }
    if (contentType && !contentDisposition) {
        contentDisposition = contentTypeToContentDisposition(contentType);
    }
    if (!contentDisposition) {
        throw new Error("Content disposition undefined.");
    }
    if (!contentType) {
        throw new Error("Content type undefined.");
    }
    return {
        contentDisposition,
        contentType,
        content
    };
}
