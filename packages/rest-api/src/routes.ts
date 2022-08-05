/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './v2/usersController';
import type { RequestHandler } from 'express';
import * as express from 'express';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "IUserEmailVerificationToken": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
            "address": {"dataType":"string","required":true},
            "when": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IMeteorLoginToken": {
        "dataType": "refObject",
        "properties": {
            "hashedToken": {"dataType":"string","required":true},
            "twoFactorAuthorizedUntil": {"dataType":"datetime"},
            "twoFactorAuthorizedHash": {"dataType":"string"},
            "when": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IPersonalAccessToken": {
        "dataType": "refObject",
        "properties": {
            "hashedToken": {"dataType":"string","required":true},
            "twoFactorAuthorizedUntil": {"dataType":"datetime"},
            "twoFactorAuthorizedHash": {"dataType":"string"},
            "type": {"dataType":"enum","enums":["personalAccessToken"],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "lastTokenPart": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "bypassTwoFactor": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginToken": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"IMeteorLoginToken"},{"ref":"IPersonalAccessToken"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserEmailCode": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string","required":true},
            "expire": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserServices": {
        "dataType": "refObject",
        "properties": {
            "password": {"dataType":"nestedObjectLiteral","nestedProperties":{"bcrypt":{"dataType":"string","required":true}}},
            "passwordHistory": {"dataType":"array","array":{"dataType":"string"}},
            "email": {"dataType":"nestedObjectLiteral","nestedProperties":{"verificationTokens":{"dataType":"array","array":{"dataType":"refObject","ref":"IUserEmailVerificationToken"}}}},
            "resume": {"dataType":"nestedObjectLiteral","nestedProperties":{"loginTokens":{"dataType":"array","array":{"dataType":"refAlias","ref":"LoginToken"}}}},
            "cloud": {"dataType":"any"},
            "google": {"dataType":"any"},
            "facebook": {"dataType":"any"},
            "github": {"dataType":"any"},
            "totp": {"dataType":"nestedObjectLiteral","nestedProperties":{"secret":{"dataType":"string","required":true},"hashedBackup":{"dataType":"array","array":{"dataType":"string"},"required":true},"enabled":{"dataType":"boolean","required":true}}},
            "email2fa": {"dataType":"nestedObjectLiteral","nestedProperties":{"changedAt":{"dataType":"datetime","required":true},"enabled":{"dataType":"boolean","required":true}}},
            "emailCode": {"dataType":"array","array":{"dataType":"refObject","ref":"IUserEmailCode"},"required":true},
            "saml": {"dataType":"nestedObjectLiteral","nestedProperties":{"nameID":{"dataType":"string"},"idpSession":{"dataType":"string"},"idp":{"dataType":"string"},"provider":{"dataType":"string"},"inResponseTo":{"dataType":"string"}}},
            "ldap": {"dataType":"nestedObjectLiteral","nestedProperties":{"idAttribute":{"dataType":"string"},"id":{"dataType":"string","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserEmail": {
        "dataType": "refObject",
        "properties": {
            "address": {"dataType":"string","required":true},
            "verified": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserStatus": {
        "dataType": "refEnum",
        "enums": ["online","away","offline","busy"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserSettings": {
        "dataType": "refObject",
        "properties": {
            "profile": {"dataType":"any","required":true},
            "preferences": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUser": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "_updatedAt": {"dataType":"datetime","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "roles": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "type": {"dataType":"string","required":true},
            "active": {"dataType":"boolean","required":true},
            "username": {"dataType":"string"},
            "nickname": {"dataType":"string"},
            "name": {"dataType":"string"},
            "services": {"ref":"IUserServices"},
            "emails": {"dataType":"array","array":{"dataType":"refObject","ref":"IUserEmail"}},
            "status": {"ref":"UserStatus"},
            "statusConnection": {"dataType":"string"},
            "lastLogin": {"dataType":"datetime"},
            "bio": {"dataType":"string"},
            "avatarOrigin": {"dataType":"string"},
            "avatarETag": {"dataType":"string"},
            "avatarUrl": {"dataType":"string"},
            "utcOffset": {"dataType":"double"},
            "language": {"dataType":"string"},
            "statusDefault": {"ref":"UserStatus"},
            "statusText": {"dataType":"string"},
            "oauth": {"dataType":"nestedObjectLiteral","nestedProperties":{"authorizedClients":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
            "statusLivechat": {"dataType":"string"},
            "e2e": {"dataType":"nestedObjectLiteral","nestedProperties":{"public_key":{"dataType":"string","required":true},"private_key":{"dataType":"string","required":true}}},
            "requirePasswordChange": {"dataType":"boolean"},
            "customFields": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"}},
            "settings": {"ref":"IUserSettings"},
            "defaultRoom": {"dataType":"string"},
            "ldap": {"dataType":"boolean"},
            "extension": {"dataType":"string"},
            "inviteToken": {"dataType":"string"},
            "federated": {"dataType":"boolean"},
            "canViewAllInfo": {"dataType":"boolean"},
            "phone": {"dataType":"string"},
            "reason": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_IUser.username_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"username":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserCreationParams": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_IUser.username_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: express.Router) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        app.get('/users/:userId',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUser)),

            function UsersController_getUser(request: any, response: any, next: any) {
            const args = {
                    userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new UsersController();


              const promise = controller.getUser.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/users',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUsers)),

            function UsersController_getUsers(request: any, response: any, next: any) {
            const args = {
                    name: {"in":"query","name":"name","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new UsersController();


              const promise = controller.getUsers.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/users',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.createUser)),

            function UsersController_createUser(request: any, response: any, next: any) {
            const args = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UserCreationParams"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const controller = new UsersController();


              const promise = controller.createUser.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, 201, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }

    function promiseHandler(controllerObj: any, promise: any, response: any, successStatus: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode = successStatus;
                let headers;
                if (isController(controllerObj)) {
                    headers = controllerObj.getHeaders();
                    statusCode = controllerObj.getStatus() || statusCode;
                }

                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                returnHandler(response, statusCode, data, headers)
            })
            .catch((error: any) => next(error));
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function returnHandler(response: any, statusCode?: number, data?: any, headers: any = {}) {
        if (response.headersSent) {
            return;
        }
        Object.keys(headers).forEach((name: string) => {
            response.set(name, headers[name]);
        });
        if (data && typeof data.pipe === 'function' && data.readable && typeof data._read === 'function') {
            data.pipe(response);
        } else if (data !== null && data !== undefined) {
            response.status(statusCode || 200).json(data);
        } else {
            response.status(statusCode || 204).end();
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function responder(response: any): TsoaResponse<HttpStatusCodeLiteral, unknown>  {
        return function(status, data, headers) {
            returnHandler(response, status, data, headers);
        };
    };

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function getValidatedArgs(args: any, request: any, response: any): any[] {
        const fieldErrors: FieldErrors  = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'path':
                    return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'header':
                    return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body':
                    return validationService.ValidateParam(args[key], request.body, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body-prop':
                    return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.', {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'formData':
                    if (args[key].dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.file, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else if (args[key].dataType === 'array' && args[key].array.dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.files, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else {
                        return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    }
                case 'res':
                    return responder(response);
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
