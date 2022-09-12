module.export({URI:function(){return URI},equivalentURI:function(){return equivalentURI}});var Parameters;module.link("./parameters",{Parameters:function(v){Parameters=v}},0);/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * URI.
 * @public
 */
class URI extends Parameters {
    /**
     * Constructor
     * @param scheme -
     * @param user -
     * @param host -
     * @param port -
     * @param parameters -
     * @param headers -
     */
    constructor(scheme = "sip", user, host, port, parameters, headers) {
        super(parameters || {});
        this.headers = {};
        // Checks
        if (!host) {
            throw new TypeError('missing or invalid "host" parameter');
        }
        for (const header in headers) {
            // eslint-disable-next-line no-prototype-builtins
            if (headers.hasOwnProperty(header)) {
                this.setHeader(header, headers[header]);
            }
        }
        // Raw URI
        this.raw = {
            scheme,
            user,
            host,
            port
        };
        // Normalized URI
        this.normal = {
            scheme: scheme.toLowerCase(),
            user,
            host: host.toLowerCase(),
            port
        };
    }
    get scheme() { return this.normal.scheme; }
    set scheme(value) {
        this.raw.scheme = value;
        this.normal.scheme = value.toLowerCase();
    }
    get user() { return this.normal.user; }
    set user(value) {
        this.normal.user = this.raw.user = value;
    }
    get host() { return this.normal.host; }
    set host(value) {
        this.raw.host = value;
        this.normal.host = value.toLowerCase();
    }
    get aor() { return this.normal.user + "@" + this.normal.host; }
    get port() { return this.normal.port; }
    set port(value) {
        this.normal.port = this.raw.port = value === 0 ? value : value;
    }
    setHeader(name, value) {
        this.headers[this.headerize(name)] = (value instanceof Array) ? value : [value];
    }
    getHeader(name) {
        if (name) {
            return this.headers[this.headerize(name)];
        }
    }
    hasHeader(name) {
        // eslint-disable-next-line no-prototype-builtins
        return !!name && !!this.headers.hasOwnProperty(this.headerize(name));
    }
    deleteHeader(header) {
        header = this.headerize(header);
        // eslint-disable-next-line no-prototype-builtins
        if (this.headers.hasOwnProperty(header)) {
            const value = this.headers[header];
            delete this.headers[header];
            return value;
        }
    }
    clearHeaders() {
        this.headers = {};
    }
    clone() {
        return new URI(this._raw.scheme, this._raw.user || "", this._raw.host, this._raw.port, JSON.parse(JSON.stringify(this.parameters)), JSON.parse(JSON.stringify(this.headers)));
    }
    toRaw() {
        return this._toString(this._raw);
    }
    toString() {
        return this._toString(this._normal);
    }
    get _normal() { return this.normal; }
    get _raw() { return this.raw; }
    _toString(uri) {
        let uriString = uri.scheme + ":";
        // add slashes if it's not a sip(s) URI
        if (!uri.scheme.toLowerCase().match("^sips?$")) {
            uriString += "//";
        }
        if (uri.user) {
            uriString += this.escapeUser(uri.user) + "@";
        }
        uriString += uri.host;
        if (uri.port || uri.port === 0) {
            uriString += ":" + uri.port;
        }
        for (const parameter in this.parameters) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.parameters.hasOwnProperty(parameter)) {
                uriString += ";" + parameter;
                if (this.parameters[parameter] !== null) {
                    uriString += "=" + this.parameters[parameter];
                }
            }
        }
        const headers = [];
        for (const header in this.headers) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.headers.hasOwnProperty(header)) {
                // eslint-disable-next-line @typescript-eslint/no-for-in-array
                for (const idx in this.headers[header]) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (this.headers[header].hasOwnProperty(idx)) {
                        headers.push(header + "=" + this.headers[header][idx]);
                    }
                }
            }
        }
        if (headers.length > 0) {
            uriString += "?" + headers.join("&");
        }
        return uriString;
    }
    /*
     * Hex-escape a SIP URI user.
     * @private
     * @param {String} user
     */
    escapeUser(user) {
        let decodedUser;
        // FIXME: This is called by toString above which should never throw, but
        // decodeURIComponent can throw and I've seen one case in production where
        // it did throw resulting in a cascading failure. This class should be
        // fixed so that decodeURIComponent is not called at this point (in toString).
        // The user should be decoded when the URI is constructor or some other
        // place where we can catch the error before the URI is created or somesuch.
        // eslint-disable-next-line no-useless-catch
        try {
            decodedUser = decodeURIComponent(user);
        }
        catch (error) {
            throw error;
        }
        // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
        return encodeURIComponent(decodedUser)
            .replace(/%3A/ig, ":")
            .replace(/%2B/ig, "+")
            .replace(/%3F/ig, "?")
            .replace(/%2F/ig, "/");
    }
    headerize(str) {
        const exceptions = {
            "Call-Id": "Call-ID",
            "Cseq": "CSeq",
            "Min-Se": "Min-SE",
            "Rack": "RAck",
            "Rseq": "RSeq",
            "Www-Authenticate": "WWW-Authenticate",
        };
        const name = str.toLowerCase().replace(/_/g, "-").split("-");
        const parts = name.length;
        let hname = "";
        for (let part = 0; part < parts; part++) {
            if (part !== 0) {
                hname += "-";
            }
            hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
        }
        if (exceptions[hname]) {
            hname = exceptions[hname];
        }
        return hname;
    }
}
/**
 * Returns true if URIs are equivalent per RFC 3261 Section 19.1.4.
 * @param a URI to compare
 * @param b URI to compare
 *
 * @remarks
 * 19.1.4 URI Comparison
 * Some operations in this specification require determining whether two
 * SIP or SIPS URIs are equivalent.
 *
 * https://tools.ietf.org/html/rfc3261#section-19.1.4
 * @internal
 */
function equivalentURI(a, b) {
    // o  A SIP and SIPS URI are never equivalent.
    if (a.scheme !== b.scheme) {
        return false;
    }
    // o  Comparison of the userinfo of SIP and SIPS URIs is case-
    //    sensitive.  This includes userinfo containing passwords or
    //    formatted as telephone-subscribers.  Comparison of all other
    //    components of the URI is case-insensitive unless explicitly
    //    defined otherwise.
    //
    // o  The ordering of parameters and header fields is not significant
    //    in comparing SIP and SIPS URIs.
    //
    // o  Characters other than those in the "reserved" set (see RFC 2396
    //    [5]) are equivalent to their ""%" HEX HEX" encoding.
    //
    // o  An IP address that is the result of a DNS lookup of a host name
    //    does not match that host name.
    //
    // o  For two URIs to be equal, the user, password, host, and port
    //    components must match.
    //
    // A URI omitting the user component will not match a URI that
    // includes one.  A URI omitting the password component will not
    // match a URI that includes one.
    //
    // A URI omitting any component with a default value will not
    // match a URI explicitly containing that component with its
    // default value.  For instance, a URI omitting the optional port
    // component will not match a URI explicitly declaring port 5060.
    // The same is true for the transport-parameter, ttl-parameter,
    // user-parameter, and method components.
    //
    // Defining sip:user@host to not be equivalent to
    // sip:user@host:5060 is a change from RFC 2543.  When deriving
    // addresses from URIs, equivalent addresses are expected from
    // equivalent URIs.  The URI sip:user@host:5060 will always
    // resolve to port 5060.  The URI sip:user@host may resolve to
    // other ports through the DNS SRV mechanisms detailed in [4].
    // FIXME: TODO:
    // - character compared to hex encoding is not handled
    // - password does not exist on URI currently
    if (a.user !== b.user || a.host !== b.host || a.port !== b.port) {
        return false;
    }
    // o  URI uri-parameter components are compared as follows:
    function compareParameters(a, b) {
        //  -  Any uri-parameter appearing in both URIs must match.
        const parameterKeysA = Object.keys(a.parameters);
        const parameterKeysB = Object.keys(b.parameters);
        const intersection = parameterKeysA.filter(x => parameterKeysB.includes(x));
        if (!intersection.every(key => a.parameters[key] === b.parameters[key])) {
            return false;
        }
        //  -  A user, ttl, or method uri-parameter appearing in only one
        //     URI never matches, even if it contains the default value.
        if (!["user", "ttl", "method", "transport"].every(key => a.hasParam(key) && b.hasParam(key) || !a.hasParam(key) && !b.hasParam(key))) {
            return false;
        }
        //  -  A URI that includes an maddr parameter will not match a URI
        //     that contains no maddr parameter.
        if (!["maddr"].every(key => a.hasParam(key) && b.hasParam(key) || !a.hasParam(key) && !b.hasParam(key))) {
            return false;
        }
        //  -  All other uri-parameters appearing in only one URI are
        //     ignored when comparing the URIs.
        return true;
    }
    if (!compareParameters(a, b)) {
        return false;
    }
    // o  URI header components are never ignored.  Any present header
    //    component MUST be present in both URIs and match for the URIs
    //    to match.  The matching rules are defined for each header field
    //    in Section 20.
    const headerKeysA = Object.keys(a.headers);
    const headerKeysB = Object.keys(b.headers);
    // No need to check if no headers
    if (headerKeysA.length !== 0 || headerKeysB.length !== 0) {
        // Must have same number of headers
        if (headerKeysA.length !== headerKeysB.length) {
            return false;
        }
        // Must have same headers
        const intersection = headerKeysA.filter(x => headerKeysB.includes(x));
        if (intersection.length !== headerKeysB.length) {
            return false;
        }
        // FIXME: Not to spec. But perhaps not worth fixing?
        // Must have same header values
        // It seems too much to consider multiple headers with same name.
        // It seems too much to compare two header params according to the rule of each header.
        // We'll assume a single header and compare them string to string...
        if (!intersection.every(key => a.headers[key].length && b.headers[key].length && a.headers[key][0] === b.headers[key][0])) {
            return false;
        }
    }
    return true;
}
