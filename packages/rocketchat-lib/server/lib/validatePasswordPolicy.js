const options = {
	enabled: false,
	minLength: -1,
	maxLength: -1,
	forbidRepeatingCharacters: false,
	forbidRepeatingCharactersCount: 3, //the regex is this number minus one
	mustContainAtLeastOneLowercase: false, // /[A-Z]{3,}/ could do this instead of at least one
	mustContainAtLeastOneUppercase: false,
	mustContainAtLeastOneNumber: false,
	mustContainAtLeastOneSpecialCharacter: false
};

const regex = {
	forbiddingRepeatingCharacters: new RegExp(`(.)\\1{${ options.forbidRepeatingCharactersCount - 1 },}`),
	mustContainAtLeastOneLowercase: new RegExp('[a-z]'),
	mustContainAtLeastOneUppercase: new RegExp('[A-Z]'),
	mustContainAtLeastOneNumber: new RegExp('[0-9]'),
	mustContainAtLeastOneSpecialCharacter: new RegExp('[^A-Za-z0-9]')
};

// I know this isn't needed, but it's this way
// to allow this section to be collapsed in an IDE
function _registerSettingsListeners() {
	RocketChat.settings.get('Accounts_Password_Policy_Enabled', function(key, value) {
		options.enabled = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_MinLength', function(key, value) {
		options.minLength = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_MaxLength', function(key, value) {
		options.maxLength = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_ForbidRepeatingCharacters', function(key, value) {
		options.forbidRepeatingCharacters = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_ForbidRepeatingCharactersCount', function(key, value) {
		options.forbidRepeatingCharactersCount = value;
		regex.forbiddingRepeatingCharacters = new RegExp(`(.)\\1{${ options.forbidRepeatingCharactersCount - 1 },}`);
	});

	RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneLowercase', function(key, value) {
		options.mustContainAtLeastOneLowercase = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneUppercase', function(key, value) {
		options.mustContainAtLeastOneUppercase = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneNumber', function(key, value) {
		options.mustContainAtLeastOneNumber = value;
	});

	RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneSpecialCharacter', function(key, value) {
		options.mustContainAtLeastOneSpecialCharacter = value;
	});
}

RocketChat.validatePasswordPolicy = function _validatePasswordPolicy(password) {
	if (!options.enabled) {
		return true;
	}

	if (!password || typeof password !== 'string' || !password.length) {
		throw new Meteor.Error('error-password-policy-not-met', 'The password provided does not meet the server\'s password policy.');
	}

	if (options.minLength >= 1 && password.length < options.minLength) {
		throw new Meteor.Error('error-password-policy-not-met-minLength', 'The password does not meet the minimum length password policy.');
	}

	if (options.maxLength >= 1 && password.length > options.maxLength) {
		throw new Meteor.Error('error-password-policy-not-met-maxLength', 'The password does not meet the maximum length password policy.');
	}

	if (options.forbidRepeatingCharacters && regex.forbiddingRepeatingCharacters.test(password)) {
		throw new Meteor.Error('error-password-policy-not-met-repeatingCharacters', 'The password contains repeating characters which is against the password policy.');
	}

	if (options.mustContainAtLeastOneLowercase && !regex.mustContainAtLeastOneLowercase.test(password)) {
		throw new Meteor.Error('error-password-policy-not-met-oneLowercase', 'The password does not contain at least one lowercase character which is against the password policy.');
	}

	if (options.mustContainAtLeastOneUppercase && !regex.mustContainAtLeastOneUppercase.test(password)) {
		throw new Meteor.Error('error-password-policy-not-met-oneUppercase', 'The password does not contain at least one uppercase character which is against the password policy.');
	}

	if (options.mustContainAtLeastOneNumber && !regex.mustContainAtLeastOneNumber.test(password)) {
		throw new Meteor.Error('error-password-policy-not-met-oneNumber', 'The password does not contain at least one numerical character which is against the password policy.');
	}

	if (options.mustContainAtLeastOneSpecialCharacter && !regex.mustContainAtLeastOneSpecialCharacter.test(password)) {
		throw new Meteor.Error('error-password-policy-not-met-oneSpecial', 'The password does not contain at least one special character which is against the password policy.');
	}

	return true;
};

_registerSettingsListeners();
