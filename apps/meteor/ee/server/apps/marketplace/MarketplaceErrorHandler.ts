export type ErrorScope =
	| 'v1/bundles/:id/apps'
	| 'v1/featured-apps'
	| 'v1/apps'
	| 'v1/apps/:id'
	| 'v1/apps/:id/latest'
	| 'v1/app-request/markAsSeen'
	| 'v1/app-request/stats'
	| 'v1/app-request'
	| 'v1/apps/:id/screenshots'
	| 'v1/workspaces/:id/apps/:appId'
	| 'v1/categories'
	| 'v2/apps/:id/download/:version';

export type ErrorCode = number;
export type ErrorString = string;

export type MarketplaceError =
	| {
			error: string;
			code?: ErrorCode;
			errorId?: string;
	  }
	| {
			code: ErrorCode;
			error: string;
			requestId: string;
	  }
	| {
			code: ErrorCode;
			requestId: string;
	  }
	| {
			code: ErrorCode;
			requestId: string;
	  };

// Arbitrary error code that we use when we don't have a specific error code to map to.
const DEFAULT_ERROR_CODE = 999;

const SCOPE_TO_ERROR_MAPPING: Record<ErrorScope, Record<ErrorCode, ErrorString>> = {
	'v1/bundles/:id/apps': {
		[DEFAULT_ERROR_CODE]: 'Apps_Bundles_Failed_To_Fetch_Apps',
		266: 'Apps_Bundle_Failed_To_Get_Workspace',
		319: 'Apps_Bundle_No_Bundle_Found',
	},
	'v1/featured-apps': {
		[DEFAULT_ERROR_CODE]: 'Apps_Featured_Apps_Failed_To_Fetch',
		200: 'Apps_Featured_Apps_Invalid_Version_String',
		266: 'Apps_Featured_Apps_Failed_To_Get_Workspace',
		430: 'Apps_Featured_Apps_Not_Found',
		431: 'Apps_Featured_Apps_Could_Not_Find_Info',
	},
	'v1/apps/:id': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_App',
		426: 'Apps_Invalid_App_Not_Found',
		427: 'Apps_App_Version_Not_Found',
	},
	'v1/apps/:id/latest': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_Latest_App_Version',
		269: 'Apps_Invalid_App_Id',
		270: 'Apps_Invalid_Framework_Version',
		200: 'Apps_Invalid_Version_String',
		98104: 'Apps_Unknown_App_Id',
		94747: 'Apps_Invalid_Icon',
	},
	'v1/apps': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_Marketplace_Apps',
		200: 'Apps_Marketplace_Invalid_Version_String',
		266: 'Apps_Marketplace_Failed_To_Get_Workspace',
	},
	'v1/app-request/markAsSeen': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Mark_App_Request_As_Seen',
		266: 'Apps_Failed_To_Get_Workspace',
		99999: 'Apps_Failed_To_Mark_App_Request_As_Seen_Due_To_Marketplace_Internal_Error',
	},
	'v1/app-request/stats': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Get_App_Request_Stats',
		266: 'Apps_Failed_To_Get_Workspace',
		99999: 'Apps_Failed_To_Get_App_Request_Stats_Due_To_Marketplace_Internal_Error',
	},
	'v1/app-request': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Get_App_Request',
		266: 'Apps_Failed_To_Get_Workspace',
		9999: 'Apps_App_Request_Invalid_App_Id',
		999999: 'Apps_Failed_To_Get_App_Request_Due_To_Marketplace_Internal_Error',
		456: 'Apps_Failed_To_Get_App_Request_Due_To_Marketplace_Internal_Error',
	},
	'v1/apps/:id/screenshots': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_App_Screenshots',
		257: 'Apps_Failed_To_Get_App_Screenshots_Due_To_Marketplace_Internal_Error',
	},
	'v1/workspaces/:id/apps/:appId': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Perform_Marketplace_Action',
		266: 'Apps_Failed_To_Get_Workspace',
		441: 'Apps_UnauthorizedWorkspace',
		259: 'Apps_Failed_To_Get_Purchased_Apps_Due_To_Marketplace_Internal_Error',
		195: 'Apps_Failed_To_Get_Purchased_Apps_Due_To_Marketplace_Internal_Error',
		265: 'Apps_Failed_To_Get_Purchased_Apps_Due_To_Marketplace_Internal_Error',
	},
	'v2/apps/:id/download/:version': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Perform_Marketplace_Action',
		266: 'Apps_Failed_To_Get_Workspace',
		259: 'Apps_Failed_To_Download_Apps_Due_To_Marketplace_Internal_Error',
		195: 'Apps_Failed_To_Download_Apps_Due_To_Marketplace_Internal_Error',
		196: 'Apps_Failed_To_Download_Invalid_App_Information',
		197: 'Apps_Failed_To_Download_Invalid_App_Information',
		198: 'Apps_Failed_To_Download_Invalid_App_Information',
		265: 'Apps_Failed_To_Download_Apps_Due_To_Marketplace_Internal_Error',
		465: 'Apps_Failed_To_Download_Subscription_Required',
		268: 'Apps_Failed_To_Download_Purchase_Required',
		564: 'Apps_Failed_To_Download_Non_Compiled_App',
		475: 'Apps_Failed_To_Download_App_Not_Compiled_Yet',
		199: 'Apps_Failed_To_Download_Due_To_Marketplace_Internal_Error',
	},
	'v1/categories': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_Categories',
		189: 'Apps_Failed_To_Fetch_Categories_Due_To_Marketplace_Internal_Error',
		266: 'Apps_Failed_To_Get_Workspace',
	},
};

/**
 * MarketplaceErrorHandler is the class responsible for handling our errors that happen whenever we try to interact with our Marketplace.
 * Most of the code here were lifted from marketplace-api, where we have a big coherent index of all the errors that can happen and their associated
 * codes.
 */
class MarketplaceErrorHandler {
	private getErrorMessageFromScopeAndErrorCode(scope: ErrorScope, errorCode: ErrorCode): ErrorString {
		return SCOPE_TO_ERROR_MAPPING[scope][errorCode] || SCOPE_TO_ERROR_MAPPING[scope][DEFAULT_ERROR_CODE];
	}

	public handleMarketplaceError(scope: ErrorScope, { status, error }: { status: number; error: unknown }): string {
		if (!error) {
			return 'Apps_Failed_To_Perform_Marketplace_Action';
		}
		if (typeof error === 'string') {
			return error;
		}

		if (!(typeof error === 'object')) {
			return 'Apps_Failed_To_Perform_Marketplace_Action';
		}

		if (this.isMarketplaceError(status, error)) {
			// Usually database errors don't have a code
			if (!error.code) {
				return SCOPE_TO_ERROR_MAPPING[scope][DEFAULT_ERROR_CODE];
			}

			return this.getErrorMessageFromScopeAndErrorCode(scope, error.code);
		}

		return 'Apps_Failed_To_Perform_Marketplace_Action';
	}

	private isMarketplaceError(status: number, error: unknown): error is MarketplaceError {
		// Just to make the type checker happy
		if (!error || !(typeof error === 'object')) {
			return false;
		}

		// This probably could be more robust, we could use a library to check if the object is a MarketplaceError
		// but that seems like overkill for now.
		if (status === 500 && 'error' in error) {
			return true;
		}

		if (status === 400 && 'code' in error && 'error' in error && 'requestId' in error) {
			return true;
		}

		if (status === 404 && 'code' in error && 'requestId' in error) {
			return true;
		}

		if (status === 401 && 'code' in error && 'requestId' in error) {
			return true;
		}
		return false;
	}
}

export const marketplaceErrorHandler = new MarketplaceErrorHandler();
