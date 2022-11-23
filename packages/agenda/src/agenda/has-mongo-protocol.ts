/**
 * Given a mongo connection url will check if it contains the mongo
 * @param url URL to be tested
 * @returns whether or not the url is a valid mongo URL
 */
export const hasMongoProtocol = function (url: string): boolean {
	return /mongodb(?:\+srv)?:\/\/.*/.exec(url) !== null;
};
