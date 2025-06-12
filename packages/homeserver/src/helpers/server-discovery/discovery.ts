import { Resolver } from 'node:dns/promises';
import { isIPv6 } from 'node:net';

const ipv4Regex =
	/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:\d{1,5})?$/;
const ipv6Regex = /^(\[([a-fA-F0-9:]+)\]|([a-fA-F0-9:]+))(?::(\d{1,5}))?$/;
const DEFAULT_SECURE_PORT = 8448;
const MAX_AGE_HOURS_IN_SECONDS = 86400; //24 hours
const MAX_CACHE_ALLOWED_IN_SECONDS = 172800; //48 hours

export const isIpLiteral = (ip: string): boolean => {
	if (ipv4Regex.test(ip)) {
		return true;
	}

	const ipv6Match = ip.match(ipv6Regex);

	return Boolean(ipv6Match && isIPv6(ipv6Match[2] || ipv6Match[3]));
};

export const addressWithDefaultPort = (address: string): string => {
	return `${address}:${DEFAULT_SECURE_PORT}`;
};

export const resolveWhenServerNameIsIpAddress = async (
	serverName: string,
): Promise<string> => {
	if (ipv6Regex.test(serverName)) {
		// Ensure IPv6 addresses are enclosed in square brackets
		const ipv6Match = serverName.match(ipv6Regex);
		const ipv6Address = ipv6Match?.[2] || ipv6Match?.[3];
		const port = ipv6Match?.[4];

		return port ? serverName : addressWithDefaultPort(`[${ipv6Address}]`);
	}

	const url = new URL(`http://${serverName}`);

	return url.port ? serverName : addressWithDefaultPort(serverName);
};

const formatIpAddressWithOptionalPort = (
	address: string,
	port = '',
): string => {
	return isIPv6(address) ? `[${address}]${port}` : `${address}${port}`;
};

export const resolveWhenServerNameIsAddressWithPort = async (
	serverName: string,
): Promise<string> => {
	const [hostname, port] = serverName.split(':');

	const resolver = new Resolver();

	const addresses = await resolver.resolveAny(hostname);

	if (addresses.length === 0) {
		return `${hostname}:${port}`;
	}

	for (const address of addresses) {
		if (address.type === 'CNAME') {
			return formatIpAddressWithOptionalPort(address.value, `:${port}`);
		}
		if (address.type === 'AAAA' || address.type === 'A') {
			return formatIpAddressWithOptionalPort(address.address, `:${port}`);
		}
	}

	return addressWithDefaultPort(hostname);
};

export const resolveUsingSRVRecordsOrFallbackToOtherRecords = async (
	serverName: string,
): Promise<string> => {
	const resolver = new Resolver();
	const srvRecords = await resolver.resolveSrv(
		`_matrix-fed._tcp.${serverName}`,
	);

	if (srvRecords.length > 0) {
		for (const srv of srvRecords) {
			const addresses = await resolver.resolveAny(srv.name);
			for (const address of addresses) {
				if (address.type === 'AAAA' || address.type === 'A') {
					const ipAddress = isIPv6(address.address)
						? `[${address.address}]`
						: address.address;

					return srv.port
						? `${ipAddress}:${srv.port}`
						: addressWithDefaultPort(`[${ipAddress}]`);
				}
			}
		}

		return addressWithDefaultPort(serverName);
	}

	const addresses = await resolver.resolveAny(serverName);
	for (const address of addresses) {
		if (
			address.type === 'CNAME' ||
			address.type === 'AAAA' ||
			address.type === 'A'
		) {
			const ipAddress =
				address.type === 'CNAME' ? address.value : address.address;
			const formattedIpAddress = formatIpAddressWithOptionalPort(ipAddress);

			return addressWithDefaultPort(formattedIpAddress);
		}
	}

	return addressWithDefaultPort(serverName);
};

export const getAddressFromTargetWellKnownEndpoint = async (
	serverName: string,
): Promise<{ address: string; maxAge: number }> => {
	let response: Response | undefined;
	let data: { 'm.server': string } | undefined;
	try {
		response = await fetch(`https://${serverName}/.well-known/matrix/server`);

		if (!response.ok) {
			throw new Error();
		}

		data = await response.json();
	} catch (error) {
		throw new Error('No address found');
	}

	if (!data?.['m.server']) {
		throw new Error('No address found');
	}

	// Cache control headers
	const cacheControl = response.headers.get('cache-control');
	let maxAge = MAX_AGE_HOURS_IN_SECONDS;

	if (cacheControl) {
		const match = cacheControl.match(/max-age=(\d+)/);
		if (match) {
			maxAge = Math.min(
				Number.parseInt(match[1], 10),
				MAX_CACHE_ALLOWED_IN_SECONDS,
			);
		}
	}

	const address = data['m.server'];

	return { address, maxAge };
};

const addressHasExplicitPort = (address: string): boolean =>
	!isIpLiteral(address) && new URL(`http://${address}`).port !== '';

export const wellKnownCache = new Map<
	string,
	{ address: string; maxAge: number; timestamp: number }
>();

export const getWellKnownCachedAddress = (
	serverName: string,
): string | null => {
	const cached = wellKnownCache.get(serverName);
	if (cached && Date.now() < cached.timestamp + cached.maxAge * 1000) {
		return cached.address;
	}
	return null;
};

// const resolveFollowingWellKnownRules = async (
// 	serverName: string,
// ): Promise<string> => {
// 	try {
// 		if (isIpLiteral(serverName)) {
// 			return resolveWhenServerNameIsIpAddress(serverName);
// 		}

// 		if (addressHasExplicitPort(serverName)) {
// 			return resolveWhenServerNameIsAddressWithPort(serverName);
// 		}
// 	} catch (error) {
// 		return addressWithDefaultPort(serverName);
// 	}

// 	return resolveUsingSRVRecordsOrFallbackToOtherRecords(serverName);
// };

const getAddressFromWellKnownData = async (
	serverName: string,
): Promise<string> => {
	const cachedAddress = getWellKnownCachedAddress(serverName);
	if (cachedAddress) {
		return cachedAddress;
	}

	const { address, maxAge } =
		await getAddressFromTargetWellKnownEndpoint(serverName);
	wellKnownCache.set(serverName, { address, maxAge, timestamp: Date.now() });

	return address;
};

const defaultOwnServerAddress = (ownServerName: string): string => {
	return `${ownServerName}:443`;
};

export const resolveHostAddressByServerName = async (
	serverName: string,
	ownServerName: string,
): Promise<{ address: string; headers: { Host: string } }> => {
	try {
		if (isIpLiteral(serverName)) {
			const address = await resolveWhenServerNameIsIpAddress(serverName);
			return {
				address,
				headers: { Host: defaultOwnServerAddress(ownServerName) },
			};
		}

		if (addressHasExplicitPort(serverName)) {
			const address = await resolveWhenServerNameIsAddressWithPort(serverName);
			return {
				address,
				headers: { Host: defaultOwnServerAddress(ownServerName) },
			};
		}

		const rawAddress = await getAddressFromWellKnownData(serverName);
		// const address = await resolveFollowingWellKnownRules(rawAddress);

		// TODO: Check it later... only way I found to make the request work
		return { address: rawAddress, headers: { Host: rawAddress } };
	} catch (error) {
		if (error instanceof Error && error.message === 'No address found') {
			const address = await resolveUsingSRVRecordsOrFallbackToOtherRecords(
				serverName,
			).catch(() => addressWithDefaultPort(serverName));

			return { address, headers: { Host: serverName } };
		}
		const address = await addressWithDefaultPort(serverName);

		return { address, headers: { Host: address } };
	}
};
