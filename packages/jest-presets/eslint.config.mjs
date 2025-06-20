import { config } from '@rocket.chat/eslint-config/base';
export default [...config, { ignores: ['/client/**', '/server/**'] }]