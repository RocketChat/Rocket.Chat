import { UnknownPolicyError } from '../errors';
import { parseSpif } from './parseSpif';
import type { SecurityPolicy } from './types';

/**
 * The security policies this server enforces, keyed by policy OID.
 */
export class PolicyRegistry {
	private readonly policies = new Map<string, SecurityPolicy>();

	/**
	 * Parses and registers a SPIF, replacing any earlier version of the same policy.
	 */
	load(xml: string): SecurityPolicy {
		const policy = parseSpif(xml);
		this.policies.set(policy.id, policy);
		return policy;
	}

	/**
	 * Swaps in a whole new set of policies at once, so a failed reload keeps the previous set.
	 */
	replaceAll(xmls: string[]): SecurityPolicy[] {
		const parsed = xmls.map(parseSpif);
		this.policies.clear();
		for (const policy of parsed) {
			this.policies.set(policy.id, policy);
		}
		return parsed;
	}

	find(policyId: string): SecurityPolicy | undefined {
		return this.policies.get(policyId);
	}

	get(policyId: string): SecurityPolicy {
		const policy = this.policies.get(policyId);
		if (!policy) {
			throw new UnknownPolicyError(policyId);
		}
		return policy;
	}

	list(): SecurityPolicy[] {
		return [...this.policies.values()];
	}
}
