
#  @rocket.chat/rest-typings

Package containing all Rocket.Chat rest endpoint definitions


## Contributing

Contributions are always welcome!
However we have some recommendations.
- Check if your implementation matches your definitions, a bad definition is worse than none.
- Use the generic types we created for paging.
- Create functions that assert properties (very useful for the backend)
- Do tests to ensure that your assertions are correct.
- Avoid incomplete and unknow typings

### Good examples of what not to do:

#### If you have an endpoint that accepts name or id, both are not optional, one of them is required

```typescript
    
    type EndPointTestGetParams = { name?: string; id?: string; } // WRONG!

    type EndPointTestGetParams = { name: string; } | { id: string; } // Better :)
````

#### If you have an endpoint that accepts name or id, both are not optional, one of them is required

```typescript
    export const isEndPointTestGetParams = (props: any) is EndPointTestGetParams => 'name' in prop || 'id' in prop; // WRONG!

    // .... Better
    
    
    import Ajv from 'ajv';

    const ajv = new Ajv();
    const endPointTestGetParams = {
        oneOf: [
            {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                },
                required: ['name'],
                additionalProperties: false,
            },
            {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                    },
                },
                required: ['id'],
                additionalProperties: false,
            },
        ],
    };

    export const isEndPointTestGetParams = ajv.compile<EndPointTestGetParams>(endPointTestGetParams);
```
## Optimizations

we use interfaces to register endpoints, so if you use a custom version, or miss an endpoint, you don't necessarily need to recompile the code, you can do it in your own code

```typescript
    declare module '@rocket.chat/rest-typings' {
        interface Endpoints {
            'custom/endpoint': {
                GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
                    some: string[];
                }>;
            };
        }
    }
```

## License

MIT

