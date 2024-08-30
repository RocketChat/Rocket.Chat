import * as ts from 'typescript';

import { extractParameters, extractResponses } from './extractors';
import type { Node, TypeChecker, IEndpointStructure } from './types';

export function extractEndpoints(node: Node, checker: TypeChecker): IEndpointStructure {
	const endpoints: IEndpointStructure = {};
	const regex = /.*Endpoints$/;

	if (ts.isTypeAliasDeclaration(node) && regex.test(node.name.text)) {
		const endpointType = node.type as ts.TypeLiteralNode;
		endpointType.members?.forEach((member) => {
			if (ts.isPropertySignature(member) && member.name && ts.isStringLiteral(member.name)) {
				const apiPath = member.name.text;
				const methodType = member.type as ts.TypeLiteralNode;

				endpoints[apiPath] = {};

				methodType.members?.forEach((methodMember) => {
					if (ts.isPropertySignature(methodMember) && methodMember.name && ts.isIdentifier(methodMember.name)) {
						const methodName = methodMember.name.text;
						const method = methodMember.type as ts.FunctionTypeNode;

						endpoints[apiPath][methodName] = {
							params: extractParameters(method, checker),
							response: extractResponses(method, checker),
						};
					}
				});
			}
		});
	}

	ts.forEachChild(node, (childNode) => {
		const childEndpoints = extractEndpoints(childNode, checker);
		Object.assign(endpoints, childEndpoints);
	});

	return endpoints;
}
