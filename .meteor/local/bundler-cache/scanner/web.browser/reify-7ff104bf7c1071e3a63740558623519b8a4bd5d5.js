module.export({Messager:()=>Messager});let C,Grammar;module.link("../core",{C(v){C=v},Grammar(v){Grammar=v}},0);
/**
 * A messager sends a {@link Message} (outgoing MESSAGE).
 * @public
 */
class Messager {
    /**
     * Constructs a new instance of the `Messager` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param content - Content for the body of the message.
     * @param contentType - Content type of the body of the message.
     * @param options - Options bucket. See {@link MessagerOptions} for details.
     */
    constructor(userAgent, targetURI, content, contentType = "text/plain", options = {}) {
        // Logger
        this.logger = userAgent.getLogger("sip.Messager");
        // Default options params
        options.params = options.params || {};
        // URIs
        let fromURI = userAgent.userAgentCore.configuration.aor;
        if (options.params.fromUri) {
            fromURI =
                typeof options.params.fromUri === "string" ? Grammar.URIParse(options.params.fromUri) : options.params.fromUri;
        }
        if (!fromURI) {
            throw new TypeError("Invalid from URI: " + options.params.fromUri);
        }
        let toURI = targetURI;
        if (options.params.toUri) {
            toURI = typeof options.params.toUri === "string" ? Grammar.URIParse(options.params.toUri) : options.params.toUri;
        }
        if (!toURI) {
            throw new TypeError("Invalid to URI: " + options.params.toUri);
        }
        // Message params
        const params = options.params ? Object.assign({}, options.params) : {};
        // Extra headers
        const extraHeaders = (options.extraHeaders || []).slice();
        // Body
        const contentDisposition = "render";
        const body = {
            contentDisposition,
            contentType,
            content
        };
        // Build the request
        this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(C.MESSAGE, targetURI, fromURI, toURI, params, extraHeaders, body);
        // User agent
        this.userAgent = userAgent;
    }
    /**
     * Send the message.
     */
    message(options = {}) {
        this.userAgent.userAgentCore.request(this.request, options.requestDelegate);
        return Promise.resolve();
    }
}
