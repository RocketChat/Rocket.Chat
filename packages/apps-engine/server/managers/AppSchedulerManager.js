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
exports.AppSchedulerManager = void 0;
const AppStatus_1 = require("../../definition/AppStatus");
function createProcessorId(jobId, appId) {
    return jobId.includes(`_${appId}`) ? jobId : `${jobId}_${appId}`;
}
class AppSchedulerManager {
    constructor(manager) {
        this.manager = manager;
        this.bridge = this.manager.getBridges().getSchedulerBridge();
        this.registeredProcessors = new Map();
    }
    registerProcessors() {
        return __awaiter(this, arguments, void 0, function* (processors = [], appId) {
            if (!this.registeredProcessors.get(appId)) {
                this.registeredProcessors.set(appId, {});
            }
            return this.bridge.doRegisterProcessors(processors.map((processor) => {
                const processorId = createProcessorId(processor.id, appId);
                this.registeredProcessors.get(appId)[processorId] = processor;
                return {
                    id: processorId,
                    processor: this.wrapProcessor(appId, processorId).bind(this),
                    startupSetting: processor.startupSetting,
                };
            }), appId);
        });
    }
    wrapProcessor(appId, processorId) {
        return (jobContext) => __awaiter(this, void 0, void 0, function* () {
            const processor = this.registeredProcessors.get(appId)[processorId];
            if (!processor) {
                throw new Error(`Processor ${processorId} not available`);
            }
            const app = this.manager.getOneById(appId);
            const status = yield app.getStatus();
            const previousStatus = app.getPreviousStatus();
            const isNotToRunJob = this.isNotToRunJob(status, previousStatus);
            if (isNotToRunJob) {
                return;
            }
            try {
                yield app.getDenoRuntime().sendRequest({
                    method: `scheduler:${processor.id}`,
                    params: [jobContext],
                });
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        });
    }
    scheduleOnce(job, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doScheduleOnce(Object.assign(Object.assign({}, job), { id: createProcessorId(job.id, appId) }), appId);
        });
    }
    scheduleRecurring(job, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doScheduleRecurring(Object.assign(Object.assign({}, job), { id: createProcessorId(job.id, appId) }), appId);
        });
    }
    cancelJob(jobId, appId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doCancelJob(createProcessorId(jobId, appId), appId);
        });
    }
    cancelAllJobs(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doCancelAllJobs(appId);
        });
    }
    cleanUp(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.bridge.cancelAllJobs(appId);
        });
    }
    isNotToRunJob(status, previousStatus) {
        const isAppCurrentDisabled = status === AppStatus_1.AppStatus.DISABLED || status === AppStatus_1.AppStatus.MANUALLY_DISABLED;
        const wasAppDisabled = previousStatus === AppStatus_1.AppStatus.DISABLED || previousStatus === AppStatus_1.AppStatus.MANUALLY_DISABLED;
        return (status === AppStatus_1.AppStatus.INITIALIZED && wasAppDisabled) || isAppCurrentDisabled;
    }
}
exports.AppSchedulerManager = AppSchedulerManager;
//# sourceMappingURL=AppSchedulerManager.js.map