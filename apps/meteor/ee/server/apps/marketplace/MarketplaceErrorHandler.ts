export type ErrorScope = 'bundles/:id/apps' | 'featured-apps' | 'apps/:id' | 'marketplace';
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

// TODO: double check this scopes, and error codes to match marketplace-api
const SCOPE_TO_ERROR_MAPPING: Record<ErrorScope, Record<ErrorCode, ErrorString>> = {
	'bundles/:id/apps': {
		[DEFAULT_ERROR_CODE]: 'Apps_Bundles_Failed_To_Fetch_Apps',
		266: 'Apps_Bundle_Failed_To_Get_Workspace',
		319: 'Apps_Bundle_No_Bundle_Found',
	},
	'featured-apps': {
		[DEFAULT_ERROR_CODE]: 'Apps_Featured_Apps_Failed_To_Fetch',
		200: 'Apps_Featured_Apps_Invalid_Version_String',
		266: 'Apps_Featured_Apps_Failed_To_Get_Workspace',
		430: 'Apps_Featured_Apps_Not_Found',
		431: 'Apps_Featured_Apps_Could_Not_Find_Info',
	},
	'apps/:id': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_App',
		426: 'Apps_Invalid_App_Not_Found',
		427: 'Apps_App_Version_Not_Found',
	},
	'marketplace': {
		[DEFAULT_ERROR_CODE]: 'Apps_Failed_To_Fetch_Marketplace_Apps',
		200: 'Apps_Marketplace_Invalid_Version_String',
		266: 'Apps_Marketplace_Failed_To_Get_Workspace',
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
