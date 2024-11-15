"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRoute = void 0;
const react_1 = require("react");
const RouterContext_1 = require("../RouterContext");
/** @deprecated prefer `useRouter` */
const useRoute = (name) => {
    const router = (0, react_1.useContext)(RouterContext_1.RouterContext);
    return (0, react_1.useMemo)(() => ({
        push: (params, queryStringParameters) => {
            const search = typeof queryStringParameters === 'function' ? queryStringParameters(router.getSearchParameters()) : queryStringParameters;
            router.navigate({ name, params, search }, { replace: false });
        },
        replace: (params, queryStringParameters) => {
            const search = typeof queryStringParameters === 'function' ? queryStringParameters(router.getSearchParameters()) : queryStringParameters;
            router.navigate({ name, params, search }, { replace: true });
        },
    }), [name, router]);
};
exports.useRoute = useRoute;
//# sourceMappingURL=useRoute.js.map