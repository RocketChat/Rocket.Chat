module.export({constructOutgoingResponse:function(){return constructOutgoingResponse}});var getReasonPhrase,newTag,utf8Length;module.link("./utils",{getReasonPhrase:function(v){getReasonPhrase=v},newTag:function(v){newTag=v},utf8Length:function(v){utf8Length=v}},0);
/**
 * When a UAS wishes to construct a response to a request, it follows
 * the general procedures detailed in the following subsections.
 * Additional behaviors specific to the response code in question, which
 * are not detailed in this section, may also be required.
 * https://tools.ietf.org/html/rfc3261#section-8.2.6
 * @internal
 */
function constructOutgoingResponse(message, options) {
    const CRLF = "\r\n";
    if (options.statusCode < 100 || options.statusCode > 699) {
        throw new TypeError("Invalid statusCode: " + options.statusCode);
    }
    const reasonPhrase = options.reasonPhrase ? options.reasonPhrase : getReasonPhrase(options.statusCode);
    // SIP responses are distinguished from requests by having a Status-Line
    // as their start-line.  A Status-Line consists of the protocol version
    // followed by a numeric Status-Code and its associated textual phrase,
    // with each element separated by a single SP character.
    // https://tools.ietf.org/html/rfc3261#section-7.2
    let response = "SIP/2.0 " + options.statusCode + " " + reasonPhrase + CRLF;
    // One largely non-method-specific guideline for the generation of
    // responses is that UASs SHOULD NOT issue a provisional response for a
    // non-INVITE request.  Rather, UASs SHOULD generate a final response to
    // a non-INVITE request as soon as possible.
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.1
    if (options.statusCode >= 100 && options.statusCode < 200) {
        // TODO
    }
    // When a 100 (Trying) response is generated, any Timestamp header field
    // present in the request MUST be copied into this 100 (Trying)
    // response.  If there is a delay in generating the response, the UAS
    // SHOULD add a delay value into the Timestamp value in the response.
    // This value MUST contain the difference between the time of sending of
    // the response and receipt of the request, measured in seconds.
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.1
    if (options.statusCode === 100) {
        // TODO
    }
    // The From field of the response MUST equal the From header field of
    // the request.  The Call-ID header field of the response MUST equal the
    // Call-ID header field of the request.  The CSeq header field of the
    // response MUST equal the CSeq field of the request.  The Via header
    // field values in the response MUST equal the Via header field values
    // in the request and MUST maintain the same ordering.
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.2
    const fromHeader = "From: " + message.getHeader("From") + CRLF;
    const callIdHeader = "Call-ID: " + message.callId + CRLF;
    const cSeqHeader = "CSeq: " + message.cseq + " " + message.method + CRLF;
    const viaHeaders = message.getHeaders("via").reduce((previous, current) => {
        return previous + "Via: " + current + CRLF;
    }, "");
    // If a request contained a To tag in the request, the To header field
    // in the response MUST equal that of the request.  However, if the To
    // header field in the request did not contain a tag, the URI in the To
    // header field in the response MUST equal the URI in the To header
    // field; additionally, the UAS MUST add a tag to the To header field in
    // the response (with the exception of the 100 (Trying) response, in
    // which a tag MAY be present).  This serves to identify the UAS that is
    // responding, possibly resulting in a component of a dialog ID.  The
    // same tag MUST be used for all responses to that request, both final
    // and provisional (again excepting the 100 (Trying)).
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.2
    let toHeader = "To: " + message.getHeader("to");
    if (options.statusCode > 100 && !message.parseHeader("to").hasParam("tag")) {
        let toTag = options.toTag;
        if (!toTag) {
            // Stateless UAS Behavior...
            // o  To header tags MUST be generated for responses in a stateless
            //    manner - in a manner that will generate the same tag for the
            //    same request consistently.  For information on tag construction
            //    see Section 19.3.
            // https://tools.ietf.org/html/rfc3261#section-8.2.7
            toTag = newTag(); // FIXME: newTag() currently generates random tags
        }
        toHeader += ";tag=" + toTag;
    }
    toHeader += CRLF;
    // FIXME: TODO: needs review... moved to InviteUserAgentServer (as it is specific to that)
    // let recordRouteHeaders = "";
    // if (request.method === C.INVITE && statusCode > 100 && statusCode <= 200) {
    //   recordRouteHeaders = request.getHeaders("record-route").reduce((previous, current) => {
    //     return previous + "Record-Route: " + current + CRLF;
    //   }, "");
    // }
    // FIXME: TODO: needs review...
    let supportedHeader = "";
    if (options.supported) {
        supportedHeader = "Supported: " + options.supported.join(", ") + CRLF;
    }
    // FIXME: TODO: needs review...
    let userAgentHeader = "";
    if (options.userAgent) {
        userAgentHeader = "User-Agent: " + options.userAgent + CRLF;
    }
    let extensionHeaders = "";
    if (options.extraHeaders) {
        extensionHeaders = options.extraHeaders.reduce((previous, current) => {
            return previous + current.trim() + CRLF;
        }, "");
    }
    // The relative order of header fields with different field names is not
    // significant.  However, it is RECOMMENDED that header fields which are
    // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
    // Max-Forwards, and Proxy-Authorization, for example) appear towards
    // the top of the message to facilitate rapid parsing.
    // https://tools.ietf.org/html/rfc3261#section-7.3.1
    // response += recordRouteHeaders;
    response += viaHeaders;
    response += fromHeader;
    response += toHeader;
    response += cSeqHeader;
    response += callIdHeader;
    response += supportedHeader;
    response += userAgentHeader;
    response += extensionHeaders;
    if (options.body) {
        response += "Content-Type: " + options.body.contentType + CRLF;
        response += "Content-Length: " + utf8Length(options.body.content) + CRLF + CRLF;
        response += options.body.content;
    }
    else {
        response += "Content-Length: " + 0 + CRLF + CRLF;
    }
    return { message: response };
}
