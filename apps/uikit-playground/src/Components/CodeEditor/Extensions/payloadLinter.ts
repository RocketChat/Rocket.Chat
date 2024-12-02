import { syntaxTree } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import { linter } from '@codemirror/lint';
import type { EditorView } from 'codemirror';

import parsePayload from '../Parser';

const payloadLinter = linter((view: EditorView) => {
  const diagnostics: Diagnostic[] = [];
  const tree = syntaxTree(view.state);
  let head = tree.topNode.firstChild;
  if (!head || !head.matchContext(['Script'])) {
    diagnostics.push({
      from: 0,
      to: 0,
      message: 'Expecting a Script',
      severity: 'error',
    });
    return diagnostics;
  }
  head = head.firstChild;
  if (!head || !head.matchContext(['ExpressionStatement'])) {
    diagnostics.push({
      from: 0,
      to: 0,
      message: 'Expecting an expression statement',
      severity: 'error',
    });
    return diagnostics;
  }
  head = head.firstChild;
  if (!head || !head.matchContext(['ArrayExpression'])) {
    diagnostics.push({
      from: 0,
      to: 0,
      message: 'Expecting an array expression',
      severity: 'error',
    });
    return diagnostics;
  }
  // while (head.nextSibling && head.nextSibling.name !== ']') {
  // }
  do {
    if (
      head.name !== '[' &&
      head.name !== ',' &&
      head.name !== ']' &&
      head.name !== 'ObjectExpression'
    ) {
      diagnostics.push({
        from: head.from,
        to: head.to,
        message: 'Expecting an Object expression',
        severity: 'error',
      });
      return diagnostics;
    }
    if (head.name === 'ObjectExpression') parsePayload(head, view);
    head = head.nextSibling;
  } while (head);

  return diagnostics;
});

export default payloadLinter;
