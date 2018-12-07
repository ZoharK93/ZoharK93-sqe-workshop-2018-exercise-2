import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const revertCode = (code) => {
    return escodegen.generate(code);
};

export {parseCode};
export {revertCode};
