module.export({RequestPendingError:()=>RequestPendingError});let Exception;module.link("../../core",{Exception(v){Exception=v}},0);
/**
 * An exception indicating an outstanding prior request prevented execution.
 * @public
 */
class RequestPendingError extends Exception {
    /** @internal */
    constructor(message) {
        super(message ? message : "Request pending.");
    }
}
