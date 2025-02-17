"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiEndpoint = void 0;
const accessors_1 = require("../accessors");
/** Represents an api endpoint that is being provided. */
class ApiEndpoint {
    constructor(app) {
        this.app = app;
    }
    /**
     * Return response with status 200 (OK) and a optional content
     * @param content
     */
    success(content) {
        return {
            status: accessors_1.HttpStatusCode.OK,
            content,
        };
    }
    /**
     * Return a json response adding Content Type header as
     * application/json if not already provided
     * @param reponse
     */
    json(response) {
        if (!response.headers || !response.headers['content-type']) {
            response.headers = response.headers || {};
            response.headers['content-type'] = 'application/json';
        }
        return response;
    }
}
exports.ApiEndpoint = ApiEndpoint;
//# sourceMappingURL=ApiEndpoint.js.map