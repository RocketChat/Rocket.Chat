# NRR - Non-Reactive Render

This package adds a helper to render templates with less reactivity and computations.
This is ideal to improve the render of a high amount of data.

# Use
```handlebars
{{#nrr nrrargs 'templateName' dataContext}}{{/nrr}}
```
or
```handlebars
{{#nrr nrrargs 'templateName' data1=data1 data2=data2}}{{/nrr}}
```

# Example
```handlebars
{{#nrr nrrargs 'message' message}}{{/nrr}}
```
