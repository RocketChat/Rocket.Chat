"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVideoConfDataStream = void 0;
const ui_contexts_1 = require("@rocket.chat/ui-contexts");
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("react");
const useVideoConfData_1 = require("./useVideoConfData");
const useVideoConfDataStream = ({ rid, callId, }) => {
    const queryClient = (0, react_query_1.useQueryClient)();
    const subscribeNotifyRoom = (0, ui_contexts_1.useStream)('notify-room');
    (0, react_1.useEffect)(() => {
        return subscribeNotifyRoom(`${rid}/videoconf`, (id) => id === callId &&
            queryClient.invalidateQueries(['video-conference', callId]));
    }, [rid, callId, subscribeNotifyRoom, queryClient]);
    return (0, useVideoConfData_1.useVideoConfData)({ callId });
};
exports.useVideoConfDataStream = useVideoConfDataStream;
//# sourceMappingURL=useVideoConfDataStream.js.map