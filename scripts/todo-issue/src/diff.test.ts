import assert from 'node:assert';
import { test } from 'node:test';

import { extractTodos } from './diff.ts';

test('extractTodos extracts standard single-line and multiline TODO comments in code files', () => {
	const diff = `
diff --git a/apps/meteor/server/foo.ts b/apps/meteor/server/foo.ts
new file mode 100644
--- /dev/null
+++ b/apps/meteor/server/foo.ts
@@ -0,0 +1,5 @@
+// TODO: Fix the race condition in token refresh [backend] [auth]
+// The current token refresh logic has race conditions
+// when multiple tabs are open simultaneously
+const x = 1;
+`;

	const todos = extractTodos(diff);
	assert.strictEqual(todos.length, 1);
	assert.strictEqual(todos[0].title, 'Fix the race condition in token refresh');
	assert.strictEqual(todos[0].body, 'The current token refresh logic has race conditions\nwhen multiple tabs are open simultaneously');
	assert.deepStrictEqual(todos[0].labels, ['todo', 'auth', 'backend']);
	assert.strictEqual(todos[0].filename, 'apps/meteor/server/foo.ts');
});

test('extractTodos ignores documentation and markdown files (fixes issues #42154 & #42155)', () => {
	const diff = `
diff --git a/docs/code-comments.md b/docs/code-comments.md
new file mode 100644
--- /dev/null
+++ b/docs/code-comments.md
@@ -0,0 +1,7 @@
+- the same explanation at four call sites — put it on the function they call
+  (\`TODO\` is the exception, see below)
+
+## TODO is not a comment
+
+diff --git a/README.md b/README.md
+--- a/README.md
++++ b/README.md
+@@ -10,3 +10,3 @@
+- TODO: outdated doc item
+`;

	const todos = extractTodos(diff);
	assert.strictEqual(todos.length, 0, 'Markdown and docs files must not produce TODO issues');
});

test('extractTodos ignores inline backticked `TODO` references', () => {
	const diff = `
diff --git a/packages/tools/src/logger.ts b/packages/tools/src/logger.ts
new file mode 100644
--- /dev/null
+++ b/packages/tools/src/logger.ts
@@ -0,0 +1,3 @@
+// \`TODO\` is handled automatically by scripts/todo-issue
+const a = 2;
+`;

	const todos = extractTodos(diff);
	assert.strictEqual(todos.length, 0, 'Backticked TODO references must be ignored');
});
