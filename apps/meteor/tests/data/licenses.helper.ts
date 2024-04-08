import { api, credentials, request } from "./api-data"

export const getLicenseInfo = (loadValues = false) => {
	return request.get(api('licenses.info')).set(credentials).query({ loadValues }).expect(200);
}