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
exports.SchedulerModify = void 0;
function createProcessorId(jobId, appId) {
    return jobId.includes(`_${appId}`) ? jobId : `${jobId}_${appId}`;
}
class SchedulerModify {
    constructor(bridge, appId) {
        this.bridge = bridge;
        this.appId = appId;
    }
    scheduleOnce(job) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doScheduleOnce(Object.assign(Object.assign({}, job), { id: createProcessorId(job.id, this.appId) }), this.appId);
        });
    }
    scheduleRecurring(job) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doScheduleRecurring(Object.assign(Object.assign({}, job), { id: createProcessorId(job.id, this.appId) }), this.appId);
        });
    }
    cancelJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doCancelJob(createProcessorId(jobId, this.appId), this.appId);
        });
    }
    cancelAllJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bridge.doCancelAllJobs(this.appId);
        });
    }
}
exports.SchedulerModify = SchedulerModify;
//# sourceMappingURL=SchedulerModify.js.map