// @deno-types="../../../../acorn.d.ts"
import { AnyNode, ClassDeclaration, ExpressionStatement, FunctionDeclaration, VariableDeclaration } from 'acorn';

/**
 * Partial AST blocks to support testing.
 * `start` and `end` properties are omitted for brevity.
 */

type TestNodeExcerpt<N extends AnyNode = AnyNode> = {
    code: string;
    node: N;
};

export const FunctionDeclarationFoo: TestNodeExcerpt<FunctionDeclaration> = {
    code: 'function foo() {}',
    node: {
        type: 'FunctionDeclaration',
        id: {
            type: 'Identifier',
            name: 'foo',
        },
        expression: false,
        generator: false,
        async: false,
        params: [],
        body: {
            type: 'BlockStatement',
            body: [],
        },
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
                    },
                },
            },
        ],
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
                },
            },
        },
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
                },
                property: {
                    type: 'Identifier',
                    name: 'foo',
                },
                computed: false,
                optional: false,
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
                },
            },
        },
    },
};

export const MethodDefinitionOfFooInClassBar: TestNodeExcerpt<ClassDeclaration> = {
    code: 'class Bar { foo() {} }',
    node: {
        type: 'ClassDeclaration',
        id: {
            type: 'Identifier',
            name: 'Bar',
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
                        },
                    },
                    kind: 'method',
                    computed: false,
                    static: false,
                },
            ],
        },
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
            },
            arguments: [],
            optional: false,
        },
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
                                },
                                arguments: [],
                                optional: false,
                            },
                        },
                    },
                },
            ],
        },
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
            },
            right: {
                type: 'Identifier',
                name: 'foo',
            },
        },
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
                },
                property: {
                    type: 'Identifier',
                    name: 'bar',
                },
            },
            right: {
                type: 'Identifier',
                name: 'foo',
            },
        },
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
                },
                init: {
                    type: 'Identifier',
                    name: 'foo',
                },
            },
        ],
    },
};

export const AssignmentOfFooToBarPropertyDefinition: TestNodeExcerpt<ClassDeclaration> = {
    code: 'class baz { bar = foo }',
    node: {
        type: 'ClassDeclaration',
        id: {
            type: 'Identifier',
            name: 'baz',
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
                    },
                    value: {
                        type: 'Identifier',
                        name: 'foo',
                    },
                },
            ],
        },
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
                            },
                            init: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: 'foo',
                                },
                                arguments: [],
                                optional: false,
                            },
                        },
                    ],
                },
                {
                    type: 'ReturnStatement',
                    argument: {
                        type: 'Identifier',
                        name: 'a',
                    },
                },
            ],
        },
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
                                },
                                {
                                    type: 'MemberExpression',
                                    object: {
                                        type: 'Identifier',
                                        name: 'e',
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'foo',
                                    },
                                    computed: false,
                                    optional: false,
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};
