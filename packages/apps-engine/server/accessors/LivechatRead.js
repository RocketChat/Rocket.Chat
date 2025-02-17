"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivechatRead = void 0;
class LivechatRead {
    constructor(livechatBridge, appId) {
        this.livechatBridge = livechatBridge;
        this.appId = appId;
    }
    /**
     * @deprecated please use the `isOnlineAsync` method instead.
     * In the next major, this method will be `async`
     */
    isOnline(departmentId) {
        console.warn("The `LivechatRead.isOnline` method is deprecated and won't behave as intended. Please use `LivechatRead.isOnlineAsync` instead");
        return this.livechatBridge.doIsOnline(departmentId, this.appId);
    }
    isOnlineAsync(departmentId) {
        return this.livechatBridge.doIsOnlineAsync(departmentId, this.appId);
    }
    getDepartmentsEnabledWithAgents() {
        return this.livechatBridge.doFindDepartmentsEnabledWithAgents(this.appId);
    }
    getLivechatRooms(visitor, departmentId) {
        return this.livechatBridge.doFindRooms(visitor, departmentId, this.appId);
    }
    getLivechatTotalOpenRoomsByAgentId(agentId) {
        return this.livechatBridge.doCountOpenRoomsByAgentId(agentId, this.appId);
    }
    getLivechatOpenRoomsByAgentId(agentId) {
        return this.livechatBridge.doFindOpenRoomsByAgentId(agentId, this.appId);
    }
    /**
     * @deprecated This method does not adhere to the conversion practices applied
     * elsewhere in the Apps-Engine and will be removed in the next major version.
     * Prefer the alternative methods to fetch visitors.
     */
    getLivechatVisitors(query) {
        return this.livechatBridge.doFindVisitors(query, this.appId);
    }
    getLivechatVisitorById(id) {
        return this.livechatBridge.doFindVisitorById(id, this.appId);
    }
    getLivechatVisitorByEmail(email) {
        return this.livechatBridge.doFindVisitorByEmail(email, this.appId);
    }
    getLivechatVisitorByToken(token) {
        return this.livechatBridge.doFindVisitorByToken(token, this.appId);
    }
    getLivechatVisitorByPhoneNumber(phoneNumber) {
        return this.livechatBridge.doFindVisitorByPhoneNumber(phoneNumber, this.appId);
    }
    getLivechatDepartmentByIdOrName(value) {
        return this.livechatBridge.doFindDepartmentByIdOrName(value, this.appId);
    }
    _fetchLivechatRoomMessages(roomId) {
        return this.livechatBridge.do_fetchLivechatRoomMessages(this.appId, roomId);
    }
}
exports.LivechatRead = LivechatRead;
//# sourceMappingURL=LivechatRead.js.map