import type { LOG_LEVEL } from './logger/definition';
import { OpenTelemetryExporterUrls } from './open-telemetry';

export enum ENV {
	PRODUCTION = 'production',
	TEST = 'test',
	STAGING = 'staging',
	DEVELOPMENT = 'development',
}

export type ObservabilityStartParams = {
	serviceName: string;
	env: ENV;
	telemetry: {
		sendToConsole?: boolean;
	} & OpenTelemetryExporterUrls;
	logger: {
		useLocal: boolean;
		defaultLevel?: LOG_LEVEL;
		overrideStdout?: boolean;
		lessInfoLogs?: boolean;
	};
};

export const SEMATTRS_DB_MONGODB_QUERY_ARGS = 'db.mongodb.query_arguments';
export const SEMATTRS_HTTP_COOKIES = 'http.cookies';
export const SEMATTRS_HTTP_HEADERS = 'http.headers';
export const SEMATTRS_HTTP_BODY = 'http.body';
export const SEMATTRS_HTTP_QUERY_PARAMS = 'http.query_params';
export const SEMATTRS_RPC_REQUEST_BODY = 'rpc.request_body';
export const SEMATTRS_RPC_RESPONSE_BODY = 'rpc.response_body';
export const SEMATTRS_EPHEMERAL_EVENT_NAME = 'ephemeral_event_name';
export const SEMATTRS_EPHEMERAL_EVENT_BODY = 'ephemeral_event_body';

export {
	SEMATTRS_DB_MONGODB_COLLECTION,
	SEMATTRS_DB_OPERATION,
	SEMATTRS_DB_STATEMENT,
	SEMATTRS_HTTP_URL,
	SEMATTRS_HTTP_CLIENT_IP,
	SEMATTRS_HTTP_METHOD,
	SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH,
	SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH,
	SEMATTRS_HTTP_ROUTE,
	SEMATTRS_HTTP_STATUS_CODE,
	SEMATTRS_HTTP_USER_AGENT,
	SEMATTRS_RPC_METHOD,
	SEMATTRS_RPC_SERVICE,
} from '@opentelemetry/semantic-conventions';
