module.export({TransportError:()=>TransportError});let Exception;module.link("./exception",{Exception(v){Exception=v}},0);
/**
 * Transport error.
 * @public
 */
class TransportError extends Exception {
    constructor(message) {
        super(message ? message : "Unspecified transport error.");
    }
}
