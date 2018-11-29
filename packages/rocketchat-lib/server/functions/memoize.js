import memoize from 'mem';

const { TEST_MODE } = process.env;
const TTL = { maxAge: TEST_MODE ? 0 : 10 * 1000 };
RocketChat.memoize = function(fn) {
	return memoize(fn, TTL);
};
