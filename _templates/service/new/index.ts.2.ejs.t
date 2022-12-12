---
inject: true
to: apps/meteor/server/sdk/index.ts
before: FibersContextStore
skip_if: <%= h.changeCase.pascalCase(name) %>
---
import type { I<%= h.changeCase.pascalCase(name) %>Service } from './types/I<%= h.changeCase.pascalCase(name) %>Service';