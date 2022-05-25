import type { IExportOperation, ITeam, IUser } from '@rocket.chat/core-typings';

export type UsersEndpoints = {
	'users.info': {
		GET: (params: { userId?: IUser['_id']; userName?: IUser['username'] }) => {
			user: IUser;
		};
	};
	'users.2fa.enableEmail': {
		POST: () => void;
	};
	'users.2fa.disableEmail': {
		POST: () => void;
	};
	'users.2fa.sendEmailCode': {
		POST: (params: { emailOrUsername: string }) => void;
	};
	'users.autocomplete': {
		GET: (params: { selector: string }) => {
			items: Required<Pick<IUser, '_id' | 'name' | 'username' | 'nickname' | 'status' | 'avatarETag'>>[];
		};
	};

	'users.setAvatar': {
		POST: (params: { userId?: IUser['_id']; username?: IUser['username']; avatarUrl?: string }) => void;
	};
	'users.resetAvatar': {
		POST: (params: { userId?: IUser['_id']; username?: IUser['username'] }) => void;
	};

	'users.requestDataDownload': {
		GET: (params: { fullExport?: 'true' | 'false' }) => {
			requested: boolean;
			exportOperation: IExportOperation;
		};
	};
	'users.logoutOtherClients': {
		POST: () => {
			token: string;
			tokenExpires: string;
		};
	};
	'users.removeOtherTokens': {
		POST: () => void;
	};
	'users.resetE2EKey': {
		POST: (
			params:
				| {
						userId: string;
				  }
				| {
						username: string;
				  }
				| {
						user: string;
				  },
		) => void;
	};
	'users.resetTOTP': {
		POST: (
			params:
				| {
						userId: string;
				  }
				| {
						username: string;
				  }
				| {
						user: string;
				  },
		) => void;
	};
	'users.listTeams': {
		GET: (params: { userId?: string }) => {
			teams: ITeam[];
		};
	};

	'users.logout': {
		POST: (params: { userId?: string }) => {
			message: string;
		};
	};

	'users.presence': {
		GET: (params: { from: string; ids: string | string[] }) => {
			full: boolean;
			users: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'utcOffset' | 'statusText' | 'avatarETag'>;
		};
	};

	'users.removePersonalAccessToken': {
		POST: (params: { tokenName: string }) => void;
	};

	'users.getPersonalAccessTokens': {
		GET: () => {
			tokens: {
				name: string;
				createdAt: string;
				lastTokenPart: string;
				bypassTwoFactor: boolean;
			}[];
		};
	};
	'users.regeneratePersonalAccessToken': {
		POST: (params: { tokenName: string }) => {
			token: string;
		};
	};
	'users.generatePersonalAccessToken': {
		POST: (params: { tokenName: string; bypassTwoFactor: boolean }) => {
			token: string;
		};
	};
	'users.getUsernameSuggestion': {
		GET: () => {
			result: string;
		};
	};
	'users.forgotPassword': {
		POST: (params: { email: string }) => void;
	};
	'users.getPreferences': {
		GET: () => {
			preferences: Required<IUser>['settings']['preferences'];
		};
	};
	'users.createToken': {
		POST: () => {
			data: {
				userId: string;
				authToken: string;
			};
		};
	};
};
