module.export({SessionDescriptionHandlerError:function(){return SessionDescriptionHandlerError}});var Exception;module.link("../../core",{Exception:function(v){Exception=v}},0);
/**
 * An exception indicating a session description handler error occured.
 * @public
 */
class SessionDescriptionHandlerError extends Exception {
    constructor(message) {
        super(message ? message : "Unspecified session description handler error.");
    }
}
