module.export({SessionTerminatedError:()=>SessionTerminatedError});let Exception;module.link("../../core",{Exception(v){Exception=v}},0);
/**
 * An exception indicating the session terminated before the action completed.
 * @public
 */
class SessionTerminatedError extends Exception {
    constructor() {
        super("The session has terminated.");
    }
}
