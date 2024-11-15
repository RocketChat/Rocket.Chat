module.export({StateTransitionError:()=>StateTransitionError});let Exception;module.link("../../core/exceptions/exception.js",{Exception(v){Exception=v}},0);
/**
 * An exception indicating an invalid state transition error occured.
 * @public
 */
class StateTransitionError extends Exception {
    constructor(message) {
        super(message ? message : "An error occurred during state transition.");
    }
}
