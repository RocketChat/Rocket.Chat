module.export({useVoipExtensionDetails:function(){return useVoipExtensionDetails}},true);var useEndpoint;module.link('@rocket.chat/ui-contexts',{useEndpoint:function(v){useEndpoint=v}},0);var useQuery;module.link('@tanstack/react-query',{useQuery:function(v){useQuery=v}},1);var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


const useVoipExtensionDetails = ({ extension, enabled = true }) => {
    const isEnabled = !!extension && enabled;
    const getContactDetails = useEndpoint('GET', '/v1/voip-freeswitch.extension.getDetails');
    const _a = useQuery(['voip', 'voip-extension-details', extension, getContactDetails], () => getContactDetails({ extension: extension }), { enabled: isEnabled }), { data } = _a, result = __rest(_a, ["data"]);
    return Object.assign({ data: isEnabled ? data : undefined }, result);
};
//# sourceMappingURL=useVoipExtensionDetails.js.map