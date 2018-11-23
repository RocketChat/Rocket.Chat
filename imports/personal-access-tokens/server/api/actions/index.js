import generateToken from './generateToken';
import regenerateToken from './regenerateToken';
import removeToken from './removeToken';

export default {
	...generateToken,
	...regenerateToken,
	...removeToken,
};
