"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppVideoConfProviderManager = void 0;
const errors_1 = require("../errors");
const AppPermissionManager_1 = require("./AppPermissionManager");
const AppVideoConfProvider_1 = require("./AppVideoConfProvider");
const PermissionDeniedError_1 = require("../errors/PermissionDeniedError");
const AppPermissions_1 = require("../permissions/AppPermissions");
class AppVideoConfProviderManager {
    constructor(manager) {
        this.manager = manager;
        this.bridge = this.manager.getBridges().getVideoConferenceBridge();
        this.accessors = this.manager.getAccessorManager();
        this.videoConfProviders = new Map();
        this.providerApps = new Map();
    }
    canProviderBeTouchedBy(appId, providerName) {
        const key = providerName.toLowerCase().trim();
        return (key && (!this.providerApps.has(key) || this.providerApps.get(key) === appId)) || false;
    }
    isAlreadyDefined(providerName) {
        const search = providerName.toLowerCase().trim();
        for (const [, providers] of this.videoConfProviders) {
            if (providers.has(search)) {
                return true;
            }
        }
        return false;
    }
    addProvider(appId, provider) {
        const app = this.manager.getOneById(appId);
        if (!app) {
            throw new Error('App must exist in order for a video conference provider to be added.');
        }
        if (!AppPermissionManager_1.AppPermissionManager.hasPermission(appId, AppPermissions_1.AppPermissions.videoConference.provider)) {
            throw new PermissionDeniedError_1.PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions_1.AppPermissions.videoConference.provider],
            });
        }
        const providerName = provider.name.toLowerCase().trim();
        if (!this.canProviderBeTouchedBy(appId, providerName)) {
            throw new errors_1.VideoConfProviderAlreadyExistsError(provider.name);
        }
        if (!this.videoConfProviders.has(appId)) {
            this.videoConfProviders.set(appId, new Map());
        }
        this.videoConfProviders.get(appId).set(providerName, new AppVideoConfProvider_1.AppVideoConfProvider(app, provider));
        this.linkAppProvider(appId, providerName);
    }
    registerProviders(appId) {
        if (!this.videoConfProviders.has(appId)) {
            return;
        }
        const appProviders = this.videoConfProviders.get(appId);
        if (!appProviders) {
            return;
        }
        for (const [, providerInfo] of appProviders) {
            this.registerProvider(appId, providerInfo);
        }
    }
    unregisterProviders(appId) {
        if (!this.videoConfProviders.has(appId)) {
            return;
        }
        const appProviders = this.videoConfProviders.get(appId);
        for (const [, providerInfo] of appProviders) {
            this.unregisterProvider(appId, providerInfo);
        }
        this.videoConfProviders.delete(appId);
    }
    isFullyConfigured(providerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runIsFullyConfigured(this.manager.getLogStorage(), this.accessors);
        });
    }
    onNewVideoConference(providerName, call) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runOnNewVideoConference(call, this.manager.getLogStorage(), this.accessors);
        });
    }
    onVideoConferenceChanged(providerName, call) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runOnVideoConferenceChanged(call, this.manager.getLogStorage(), this.accessors);
        });
    }
    onUserJoin(providerName, call, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runOnUserJoin(call, user, this.manager.getLogStorage(), this.accessors);
        });
    }
    getVideoConferenceInfo(providerName, call, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runGetVideoConferenceInfo(call, user, this.manager.getLogStorage(), this.accessors);
        });
    }
    generateUrl(providerName, call) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runGenerateUrl(call, this.manager.getLogStorage(), this.accessors);
        });
    }
    customizeUrl(providerName, call, user, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerInfo = this.retrieveProviderInfo(providerName);
            if (!providerInfo) {
                throw new errors_1.VideoConfProviderNotRegisteredError(providerName);
            }
            return providerInfo.runCustomizeUrl(call, user, options, this.manager.getLogStorage(), this.accessors);
        });
    }
    retrieveProviderInfo(providerName) {
        const key = providerName.toLowerCase().trim();
        for (const [, providers] of this.videoConfProviders) {
            if (!providers.has(key)) {
                continue;
            }
            const provider = providers.get(key);
            if (provider.isRegistered) {
                return provider;
            }
        }
    }
    linkAppProvider(appId, providerName) {
        this.providerApps.set(providerName, appId);
    }
    registerProvider(appId, info) {
        this.bridge.doRegisterProvider(info.provider, appId);
        info.hasBeenRegistered();
    }
    unregisterProvider(appId, info) {
        const key = info.provider.name.toLowerCase().trim();
        this.bridge.doUnRegisterProvider(info.provider, appId);
        this.providerApps.delete(key);
        info.isRegistered = false;
        const map = this.videoConfProviders.get(appId);
        if (map) {
            map.delete(key);
        }
    }
}
exports.AppVideoConfProviderManager = AppVideoConfProviderManager;
//# sourceMappingURL=AppVideoConfProviderManager.js.map