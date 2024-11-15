module.export({ContentTypeUnsupportedError:function(){return ContentTypeUnsupportedError}});var Exception;module.link("../../core",{Exception:function(v){Exception=v}},0);
/**
 * An exception indicating an unsupported content type prevented execution.
 * @public
 */
class ContentTypeUnsupportedError extends Exception {
    constructor(message) {
        super(message ? message : "Unsupported content type.");
    }
}
