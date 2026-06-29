import type { AnyNode, ClassDeclaration, ExpressionStatement, FunctionDeclaration, VariableDeclaration } from 'acorn';

/**
 * Partial AST blocks to support testing.
 * `start` and `end` properties are omitted for brevity.
 */

type TestNodeExcerpt<N extends AnyNode = AnyNode> = {
	code: string;
	node: N;
};

const startEnd = { start: 0, end: 0 };

export const FunctionDeclarationFoo: TestNodeExcerpt<FunctionDeclaration> = {
	code: 'function foo() {}',
	node: {
		type: 'FunctionDeclaration',
		id: {
			type: 'Identifier',
			name: 'foo',
			...startEnd,
		},
		expression: false,
		generator: false,
		async: false,
		params: [],
		body: {
			type: 'BlockStatement',
			body: [],
			...startEnd,
		},
		...startEnd,
	},
};

export const ConstFooAssignedFunctionExpression: TestNodeExcerpt<VariableDeclaration> = {
	code: 'const foo = function() {}',
	node: {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: 'foo',
					...startEnd,
				},
				init: {
					type: 'FunctionExpression',
					id: null,
					expression: false,
					generator: false,
					async: false,
					params: [],
					body: {
						type: 'BlockStatement',
						body: [],
						...startEnd,
					},
					...startEnd,
				},
				...startEnd,
			},
		],
		...startEnd,
	},
};

export const AssignmentExpressionOfArrowFunctionToFooIdentifier: TestNodeExcerpt<ExpressionStatement> = {
	code: 'foo = () => {}',
	node: {
		type: 'ExpressionStatement',
		expression: {
			type: 'AssignmentExpression',
			operator: '=',
			left: {
				type: 'Identifier',
				name: 'foo',
				...startEnd,
			},
			right: {
				type: 'ArrowFunctionExpression',
				id: null,
				expression: false,
				generator: false,
				async: false,
				params: [],
				body: {
					type: 'BlockStatement',
					body: [],
					...startEnd,
				},
				...startEnd,
			},
			...startEnd,
		},
		...startEnd,
	},
};

export const AssignmentExpressionOfNamedFunctionToFooMemberExpression: TestNodeExcerpt<ExpressionStatement> = {
	code: 'obj.foo = function bar() {}',
	node: {
		type: 'ExpressionStatement',
		expression: {
			type: 'AssignmentExpression',
			operator: '=',
			left: {
				type: 'MemberExpression',
				object: {
					type: 'Identifier',
					name: 'a',
					...startEnd,
				},
				property: {
					type: 'Identifier',
					name: 'foo',
					...startEnd,
				},
				computed: false,
				optional: false,
				...startEnd,
			},
			right: {
				type: 'FunctionExpression',
				id: null,
				expression: false,
				generator: false,
				async: false,
				params: [],
				body: {
					type: 'BlockStatement',
					body: [],
					...startEnd,
				},
				...startEnd,
			},
			...startEnd,
		},
		...startEnd,
	},
};

export const MethodDefinitionOfFooInClassBar: TestNodeExcerpt<ClassDeclaration> = {
	code: 'class Bar { foo() {} }',
	node: {
		type: 'ClassDeclaration',
		id: {
			type: 'Identifier',
			name: 'Bar',
			...startEnd,
		},
		superClass: null,
		body: {
			type: 'ClassBody',
			body: [
				{
					type: 'MethodDefinition',
					key: {
						type: 'Identifier',
						name: 'foo',
						...startEnd,
					},
					value: {
						type: 'FunctionExpression',
						id: null,
						expression: false,
						generator: false,
						async: false,
						params: [],
						body: {
							type: 'BlockStatement',
							body: [],
							...startEnd,
						},
						...startEnd,
					},
					kind: 'method',
					computed: false,
					static: false,
					...startEnd,
				},
			],
			...startEnd,
		},
		...startEnd,
	},
};

export const SimpleCallExpressionOfFoo: TestNodeExcerpt<ExpressionStatement> = {
	code: 'foo()',
	node: {
		type: 'ExpressionStatement',
		expression: {
			type: 'CallExpression',
			callee: {
				type: 'Identifier',
				name: 'foo',
				...startEnd,
			},
			arguments: [],
			optional: false,
			...startEnd,
		},
		...startEnd,
	},
};

export const SyncFunctionDeclarationWithAsyncCallExpression: TestNodeExcerpt<FunctionDeclaration> = {
	// NOTE: this is invalid syntax, it won't be parsed by acorn
	// but it can be an intermediary state of the AST after we run
	// `wrapWithAwait` on "bar" call expressions, for instance
	code: 'function foo() { return () => await bar() }',
	node: {
		type: 'FunctionDeclaration',
		id: {
			type: 'Identifier',
			name: 'foo',
			...startEnd,
		},
		expression: false,
		generator: false,
		async: false,
		params: [],
		body: {
			type: 'BlockStatement',
			body: [
				{
					type: 'ReturnStatement',
					argument: {
						type: 'ArrowFunctionExpression',
						id: null,
						expression: true,
						generator: false,
						async: false,
						params: [],
						body: {
							type: 'AwaitExpression',
							argument: {
								type: 'CallExpression',
								callee: {
									type: 'Identifier',
									name: 'bar',
									...startEnd,
								},
								arguments: [],
								optional: false,
								...startEnd,
							},
							...startEnd,
						},
						...startEnd,
					},
					...startEnd,
				},
			],
			...startEnd,
		},
		...startEnd,
	},
};

export const AssignmentOfFooToBar: TestNodeExcerpt<ExpressionStatement> = {
	code: 'bar = foo',
	node: {
		type: 'ExpressionStatement',
		expression: {
			type: 'AssignmentExpression',
			operator: '=',
			left: {
				type: 'Identifier',
				name: 'bar',
				...startEnd,
			},
			right: {
				type: 'Identifier',
				name: 'foo',
				...startEnd,
			},
			...startEnd,
		},
		...startEnd,
	},
};

export const AssignmentOfFooToBarMemberExpression: TestNodeExcerpt<ExpressionStatement> = {
	code: 'obj.bar = foo',
	node: {
		type: 'ExpressionStatement',
		expression: {
			type: 'AssignmentExpression',
			operator: '=',
			left: {
				type: 'MemberExpression',
				computed: false,
				optional: false,
				object: {
					type: 'Identifier',
					name: 'obj',
					...startEnd,
				},
				property: {
					type: 'Identifier',
					name: 'bar',
					...startEnd,
				},
				...startEnd,
			},
			right: {
				type: 'Identifier',
				name: 'foo',
				...startEnd,
			},
			...startEnd,
		},
		...startEnd,
	},
};

export const AssignmentOfFooToBarVariableDeclarator: TestNodeExcerpt<VariableDeclaration> = {
	code: 'const bar = foo',
	node: {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: 'bar',
					...startEnd,
				},
				init: {
					type: 'Identifier',
					name: 'foo',
					...startEnd,
				},
				...startEnd,
			},
		],
		...startEnd,
	},
};

export const AssignmentOfFooToBarPropertyDefinition: TestNodeExcerpt<ClassDeclaration> = {
	code: 'class baz { bar = foo }',
	node: {
		type: 'ClassDeclaration',
		id: {
			type: 'Identifier',
			name: 'baz',
			...startEnd,
		},
		superClass: null,
		body: {
			type: 'ClassBody',
			body: [
				{
					type: 'PropertyDefinition',
					static: false,
					computed: false,
					key: {
						type: 'Identifier',
						name: 'bar',
						...startEnd,
					},
					value: {
						type: 'Identifier',
						name: 'foo',
						...startEnd,
					},
					...startEnd,
				},
			],
			...startEnd,
		},
		...startEnd,
	},
};

const fixSimpleCallExpressionCode = `
function bar() {
    const a = foo();

    return a;
}`;

export const FixSimpleCallExpression: TestNodeExcerpt<FunctionDeclaration> = {
	code: fixSimpleCallExpressionCode,
	node: {
		type: 'FunctionDeclaration',
		id: {
			type: 'Identifier',
			name: 'bar',
			...startEnd,
		},
		expression: false,
		generator: false,
		async: false,
		params: [],
		body: {
			type: 'BlockStatement',
			body: [
				{
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [
						{
							type: 'VariableDeclarator',
							id: {
								type: 'Identifier',
								name: 'a',
								...startEnd,
							},
							init: {
								type: 'CallExpression',
								callee: {
									type: 'Identifier',
									name: 'foo',
									...startEnd,
								},
								arguments: [],
								optional: false,
								...startEnd,
							},
							...startEnd,
						},
					],
					...startEnd,
				},
				{
					type: 'ReturnStatement',
					argument: {
						type: 'Identifier',
						name: 'a',
						...startEnd,
					},
					...startEnd,
				},
			],
			...startEnd,
		},
		...startEnd,
	},
};

export const ArrowFunctionDerefCallExpression: TestNodeExcerpt<VariableDeclaration> = {
	// NOTE: this call strategy is widely used by bundlers; it's used to sever the `this`
	// reference in the method from the object that contains it. This is mostly because
	// the bundler wants to ensure that it does not messes up the bindings in the code it
	// generates.
	//
	// This would be similar to doing `foo.call(undefined)`
	code: 'const bar = () => (0, e.foo)();',
	node: {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: 'bar',
					...startEnd,
				},
				init: {
					type: 'ArrowFunctionExpression',
					id: null,
					expression: true,
					generator: false,
					async: false,
					params: [],
					body: {
						type: 'CallExpression',
						optional: false,
						arguments: [],
						callee: {
							type: 'SequenceExpression',
							expressions: [
								{
									type: 'Literal',
									value: 0,
									...startEnd,
								},
								{
									type: 'MemberExpression',
									object: {
										type: 'Identifier',
										name: 'e',
										...startEnd,
									},
									property: {
										type: 'Identifier',
										name: 'foo',
										...startEnd,
									},
									computed: false,
									optional: false,
									...startEnd,
								},
							],
							...startEnd,
						},
						...startEnd,
					},
					...startEnd,
				},
				...startEnd,
			},
		],
		...startEnd,
	},
};
