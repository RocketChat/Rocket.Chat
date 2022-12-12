---
inject: true
to: apps/meteor/server/sdk/index.ts
before: Calls without wait
skip _if: <%= h.changeCase.pascalCase(name) %>
---
export const <%= h.changeCase.camelCase(name) %> = proxifyWithWait<I<%= h.changeCase.pascalCase(name) %>Service>('<%= name %>');