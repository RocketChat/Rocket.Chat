module.export({NameAddrHeader:function(){return NameAddrHeader}});var Parameters;module.link("./parameters",{Parameters:function(v){Parameters=v}},0);
/**
 * Name Address SIP header.
 * @public
 */
class NameAddrHeader extends Parameters {
    /**
     * Constructor
     * @param uri -
     * @param displayName -
     * @param parameters -
     */
    constructor(uri, displayName, parameters) {
        super(parameters);
        this.uri = uri;
        this._displayName = displayName;
    }
    get friendlyName() {
        return this.displayName || this.uri.aor;
    }
    get displayName() { return this._displayName; }
    set displayName(value) {
        this._displayName = value;
    }
    clone() {
        return new NameAddrHeader(this.uri.clone(), this._displayName, JSON.parse(JSON.stringify(this.parameters)));
    }
    toString() {
        let body = (this.displayName || this.displayName === "0") ? '"' + this.displayName + '" ' : "";
        body += "<" + this.uri.toString() + ">";
        for (const parameter in this.parameters) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.parameters.hasOwnProperty(parameter)) {
                body += ";" + parameter;
                if (this.parameters[parameter] !== null) {
                    body += "=" + this.parameters[parameter];
                }
            }
        }
        return body;
    }
}
