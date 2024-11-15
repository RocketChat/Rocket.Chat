module.export({ContentTypeUnsupportedError:()=>ContentTypeUnsupportedError});let Exception;module.link("../../core",{Exception(v){Exception=v}},0);
/**
 * An exception indicating an unsupported content type prevented execution.
 * @public
 */
class ContentTypeUnsupportedError extends Exception {
    constructor(message) {
        super(message ? message : "Unsupported content type.");
    }
}
