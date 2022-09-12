module.export({TransportError:function(){return TransportError}});var Exception;module.link("./exception",{Exception:function(v){Exception=v}},0);
/**
 * Transport error.
 * @public
 */
class TransportError extends Exception {
    constructor(message) {
        super(message ? message : "Unspecified transport error.");
    }
}
