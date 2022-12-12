---
inject: true
to: apps/meteor/server/sdk/index.ts
before: FibersContextStore
skip _if: <%= h.changeCase.pascalCase(name) %>
---
import type { I<%= h.changeCase.pascalCase(name) %>Service } from './types/I<%= h.changeCase.pascalCase(name) %>Service';