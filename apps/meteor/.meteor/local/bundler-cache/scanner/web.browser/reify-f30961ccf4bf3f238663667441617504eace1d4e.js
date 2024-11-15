let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Field,FieldLabel,FieldRow,FieldHint,FieldDescription,InputBox,Skeleton;module.link('@rocket.chat/fuselage',{Field(v){Field=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},FieldHint(v){FieldHint=v},FieldDescription(v){FieldDescription=v},InputBox(v){InputBox=v},Skeleton(v){Skeleton=v}},1);let Form;module.link('@rocket.chat/layout',{Form(v){Form=v}},2);


const FormSkeleton = () => {
    return (_jsxs(Form, { "aria-busy": true, children: [_jsx(Form.Header, { children: _jsx(Form.Title, { children: _jsx(Skeleton, {}) }) }), _jsx(Form.Container, {}), _jsxs(Field, { children: [_jsx(FieldLabel, { children: _jsx(Skeleton, {}) }), _jsx(FieldDescription, { children: _jsx(Skeleton, {}) }), _jsx(FieldRow, { children: _jsx(InputBox.Skeleton, {}) }), _jsx(FieldHint, { children: _jsx(Skeleton, {}) })] }), _jsx(Form.Footer, { children: _jsx(Skeleton, {}) })] }));
};
module.exportDefault(FormSkeleton);
//# sourceMappingURL=FormSkeleton.js.map