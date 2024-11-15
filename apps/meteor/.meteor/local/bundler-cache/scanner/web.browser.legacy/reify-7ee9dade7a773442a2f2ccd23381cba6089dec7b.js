"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVideoConfData = void 0;
const ui_contexts_1 = require("@rocket.chat/ui-contexts");
const react_query_1 = require("@tanstack/react-query");
const useVideoConfData = ({ callId }) => {
    const getVideoConfInfo = (0, ui_contexts_1.useEndpoint)('GET', '/v1/video-conference.info');
    return (0, react_query_1.useQuery)(['video-conference', callId], () => getVideoConfInfo({ callId }), {
        staleTime: Infinity,
        refetchOnMount: (query) => {
            var _a;
            if ((_a = query.state.data) === null || _a === void 0 ? void 0 : _a.endedAt) {
                return false;
            }
            return 'always';
        },
    });
};
exports.useVideoConfData = useVideoConfData;
//# sourceMappingURL=useVideoConfData.js.map