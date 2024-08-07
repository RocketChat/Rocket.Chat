import { fixBrokenSynchronousAPICalls } from "./ast/mod.ts";

function hasPotentialDeprecatedUsage(source: string) {
    return (
        // potential usage of Room.usernames getter
        source.includes('.usernames') ||
        // potential usage of LivechatRead.isOnline method
        source.includes('.isOnline(') ||
        // potential usage of LivechatCreator.createToken method
        source.includes('.createToken(')
    )
}

export function sanitizeDeprecatedUsage(source: string) {
    if (!hasPotentialDeprecatedUsage(source)) {
        return source;
    }

    return fixBrokenSynchronousAPICalls(source);
}
