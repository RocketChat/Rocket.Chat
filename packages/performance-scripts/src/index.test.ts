import { sleep, check } from 'k6';
import http from 'k6/http';

export const options = {
	vus: 50,
	duration: '10s',
	thresholds: {
		http_req_failed: ['rate<0.01'], // http errors should be less than 1%
		http_req_duration: ['p(95)<500'], // 95 percent of response times must be below 500ms
	},
};

export default () => {
	const res = http.get('https://test-api.k6.io');
	check(res, {
		'status is 200': () => res.status === 200,
	});
	sleep(1);
};
