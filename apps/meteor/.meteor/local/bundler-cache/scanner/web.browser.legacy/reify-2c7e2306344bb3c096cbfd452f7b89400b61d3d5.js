module.export({SessionTerminatedError:function(){return SessionTerminatedError}});var Exception;module.link("../../core",{Exception:function(v){Exception=v}},0);
/**
 * An exception indicating the session terminated before the action completed.
 * @public
 */
class SessionTerminatedError extends Exception {
    constructor() {
        super("The session has terminated.");
    }
}
