"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOmnichannelSourceFromApp = exports.isVoipRoom = exports.isOmnichannelRoom = exports.OmnichannelSourceType = exports.isMultipleDirectMessageRoom = exports.isDirectMessageRoom = exports.isPrivateRoom = exports.isPublicRoom = exports.isPublicDiscussion = exports.isPrivateDiscussion = exports.isDiscussion = exports.isPublicTeamRoom = exports.isPrivateTeamRoom = exports.isTeamRoom = exports.isRoomFederated = exports.isRoomWithJoinCode = exports.isValidSidepanel = exports.isSidepanelItem = void 0;
const sidepanelItemValues = ['channels', 'discussions'];
const isSidepanelItem = (item) => {
    return sidepanelItemValues.includes(item);
};
exports.isSidepanelItem = isSidepanelItem;
const isValidSidepanel = (sidepanel) => {
    if (sidepanel === null) {
        return true;
    }
    if (!sidepanel?.items) {
        return false;
    }
    return (Array.isArray(sidepanel.items) &&
        sidepanel.items.length &&
        sidepanel.items.every(exports.isSidepanelItem) &&
        sidepanel.items.length === new Set(sidepanel.items).size);
};
exports.isValidSidepanel = isValidSidepanel;
const isRoomWithJoinCode = (room) => 'joinCodeRequired' in room && room.joinCodeRequired === true;
exports.isRoomWithJoinCode = isRoomWithJoinCode;
const isRoomFederated = (room) => 'federated' in room && room.federated === true;
exports.isRoomFederated = isRoomFederated;
const isTeamRoom = (room) => !!room.teamMain;
exports.isTeamRoom = isTeamRoom;
const isPrivateTeamRoom = (room) => (0, exports.isTeamRoom)(room) && room.t === 'p';
exports.isPrivateTeamRoom = isPrivateTeamRoom;
const isPublicTeamRoom = (room) => (0, exports.isTeamRoom)(room) && room.t === 'c';
exports.isPublicTeamRoom = isPublicTeamRoom;
const isDiscussion = (room) => !!room.prid;
exports.isDiscussion = isDiscussion;
const isPrivateDiscussion = (room) => (0, exports.isDiscussion)(room) && room.t === 'p';
exports.isPrivateDiscussion = isPrivateDiscussion;
const isPublicDiscussion = (room) => (0, exports.isDiscussion)(room) && room.t === 'c';
exports.isPublicDiscussion = isPublicDiscussion;
const isPublicRoom = (room) => room.t === 'c';
exports.isPublicRoom = isPublicRoom;
const isPrivateRoom = (room) => room.t === 'p';
exports.isPrivateRoom = isPrivateRoom;
const isDirectMessageRoom = (room) => room.t === 'd';
exports.isDirectMessageRoom = isDirectMessageRoom;
const isMultipleDirectMessageRoom = (room) => (0, exports.isDirectMessageRoom)(room) && room.uids.length > 2;
exports.isMultipleDirectMessageRoom = isMultipleDirectMessageRoom;
var OmnichannelSourceType;
(function (OmnichannelSourceType) {
    OmnichannelSourceType["WIDGET"] = "widget";
    OmnichannelSourceType["EMAIL"] = "email";
    OmnichannelSourceType["SMS"] = "sms";
    OmnichannelSourceType["APP"] = "app";
    OmnichannelSourceType["API"] = "api";
    OmnichannelSourceType["OTHER"] = "other";
})(OmnichannelSourceType || (exports.OmnichannelSourceType = OmnichannelSourceType = {}));
const isOmnichannelRoom = (room) => room.t === 'l';
exports.isOmnichannelRoom = isOmnichannelRoom;
const isVoipRoom = (room) => room.t === 'v';
exports.isVoipRoom = isVoipRoom;
const isOmnichannelSourceFromApp = (source) => {
    return source?.type === OmnichannelSourceType.APP;
};
exports.isOmnichannelSourceFromApp = isOmnichannelSourceFromApp;
//# sourceMappingURL=IRoom.js.map