module.export({managerOptions:()=>managerOptions},true);const style = {
    title: text => text,
    pathDescription: text => text,
    expr: text => text,
    type: text => text,
    string: text => text,
    number: text => text,
    primitive: text => text,
    dimmed: text => text,
    good: text => text,
    operator: text => text,
    link: text => text,
    regex: text => text,
};
const support = false;
const terminalLink = (text, url) => `${text} (${url})`;
const managerOptions = { support, terminalLink, style };
