import {
	IStampedToken,
	_generateStampedLoginToken,
	_hashStampedToken,
	_hashLoginToken,
	_tokenExpiration,
	validatePassword,
} from './lib/utils';
import { getCollection, Collections } from '../mongo';
import { IUser } from '../../../../definition/IUser';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { IAccount, ILoginResult } from '../../../../server/sdk/types/IAccount';


const saveSession = async (uid: string, newToken: IStampedToken): Promise<void> => {
	const Users = await getCollection<IUser>(Collections.User);
	await Users.updateOne({ _id: uid }, {
		$push: {
			'services.resume.loginTokens': _hashStampedToken(newToken),
		},
	});
};

const loginViaResume = async (resume: string): Promise<false | ILoginResult> => {
	const Users = await getCollection<IUser>(Collections.User);
	const hashedToken = _hashLoginToken(resume);

	const user = await Users.findOne<IUser>({
		'services.resume.loginTokens.hashedToken': hashedToken,
	}, {
		projection: {
			'services.resume.loginTokens': 1,
		},
	});
	if (!user) {
		return false;
	}

	const { when } = user.services?.resume?.loginTokens?.find((token) =>
		token.hashedToken === hashedToken,
	) || {};

	return {
		uid: user._id,
		token: resume,
		tokenExpires: when ? _tokenExpiration(when) : undefined,
		type: 'resume',
	};
};

const loginViaUsername = async ({ username }: {username: string}, password: string): Promise<false | ILoginResult> => {
	const Users = await getCollection<IUser>(Collections.User);
	const user = await Users.findOne<IUser>({ username }, { projection: { 'services.password.bcrypt': 1 } });
	if (!user) {
		return false;
	}

	const valid = user.services?.password?.bcrypt && validatePassword(password, user.services.password.bcrypt);
	if (!valid) {
		return false;
	}

	const newToken = _generateStampedLoginToken();

	await saveSession(user._id, newToken);

	return {
		uid: user._id,
		token: newToken.token,
		tokenExpires: _tokenExpiration(newToken.when),
		type: 'password',
	};
};

export class Account extends ServiceClass implements IAccount {
	protected name = 'accounts';

	async login({ resume, user, password }: {resume: string; user: {username: string}; password: string}): Promise<false | ILoginResult> {
		if (resume) {
			return loginViaResume(resume);
		}

		if (user && password) {
			return loginViaUsername(user, password);
		}

		return false;
	}
}
