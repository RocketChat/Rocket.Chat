module.export({managerOptions:()=>managerOptions},true);let chalk,supportsColor;module.link("chalk",{default(v){chalk=v},supportsColor(v){supportsColor=v}},0);let terminalLink;module.link("terminal-link",{default(v){terminalLink=v}},1);

const { dim, red, blue, green, yellow, magenta, white, } = chalk;
const styles = {
    title: red.bold,
    pathDescription: blue.italic,
    expr: white.italic,
    type: blue.bold,
    string: green,
    number: magenta,
    primitive: yellow,
    dimmed: dim,
    good: green,
    operator: white,
    link: blue,
    regex: magenta.italic
};
const style = {};
for (const key of Object.keys(styles))
    style[key] =
        (text) => styles[key](text);
const support = Boolean(supportsColor && supportsColor.hasBasic);
const managerOptions = { support, terminalLink, style };
