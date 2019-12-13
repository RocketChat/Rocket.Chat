declare module 'meteor/random' {
    namespace Random {
        function _randomString(numberOfChars: number, map: string): string;
    }
}

declare module 'meteor/accounts-base' {
    namespace Accounts {
        function _bcryptRounds(): number;
    }
}

declare namespace settings {
	function get(name: string): string;
}
