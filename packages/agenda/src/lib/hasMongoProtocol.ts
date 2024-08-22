export const hasMongoProtocol = function (url: string): boolean {
	return url.match(/mongodb(?:\+srv)?:\/\/.*/) !== null;
};
