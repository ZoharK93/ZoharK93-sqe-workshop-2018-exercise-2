import assert from 'assert';
import {parseCode, revertCode} from '../src/js/code-analyzer';
import {colorLines, getArgs, substituteFunc} from '../src/js/analyzer';

describe('The javascript parser', () => {
    it('is substituting an empty function correctly', () => {
        assert.equal(
            getSubstitution(parseCode('function f(){}')),
            'function f() {\n}'
        );});
    it('is substituting a simple function correctly', () => {
        assert.equal(
            getSubstitution(parseCode('function f(){return;}')),
            'function f() {\n' +
            '    return;\n' +
            '}'
        );});
    it('is substituting a simple function with input correctly', () => {
        assert.equal(
            getSubstitution(parseCode('function f(x){return x;}\n x=1')),
            'function f(x) {\n' +
            '    return x;\n' +
            '}'
        );});});

describe('The javascript analyzer', () => {
    it('is substituting a function with local variable correctly', () => {
        assert.equal(
            getSubstitution(parseCode('function f(x){let a=x;return a;}\n x=1')),
            'function f(x) {\n    return x;\n}'
        );});
    it('is substituting a simple function with local array variable correctly', () => {
        assert.equal(
            getSubstitution(parseCode('function f(){let a=[1,2,3];return a[1];}')),
            'function f() {\n' +
            '    return 2;\n' +
            '}'
        );});
    it('is substituting a function with multiple variable assignments correctly', () => {
        assert.equal(
            getSubstitution(parseCode('function f(x,y){let a=x-1; let b=a*y;return b;}\nx=1,y=2')),
            'function f(x, y) {\n' +
            '    return (x - 1) * y;\n' +
            '}'
        );});});

describe('The javascript analyzer', () => {
    it('is analyzing a function with if-else-if-else correctly', () => {
        let func = 'function f(x, y) {\n    if (x > 3)\n        return y;\n' +
            '    else if (y < 1)\n        return x;\n' +
            '    else\n        return x / y;\n}';
        let subCode = getSubstitution(parseCode(func));
        assert.equal(subCode,func);
        assert.deepEqual(getColors(parseCode(func+'\nx=1,y=2')), {1:'red',3:'red'});
        assert.deepEqual(getColors(parseCode(func+'\nx=5,y=2')), {1:'green',3:'red'});
        assert.deepEqual(getColors(parseCode(func+'\nx=1,y=-1')), {1:'red',3:'green'});
    });
    it('is analyzing a function with if without else correctly', () => {
        let func = 'function f(x) {\n    let a = 3;\n' +
            '    if (x[1] + a > 3)\n        return a + 1;\n    return a * 3;\n}';
        let subCode = getSubstitution(parseCode(func));
        assert.equal(subCode,'function f(x) {\n    if (x[1] + 3 > 3)\n        return 4;\n    return 9;\n}');
        assert.deepEqual(getColors(parseCode('x=[2,5,3]\n'+func)), {1:'green'});
        assert.deepEqual(getColors(parseCode('x=[2,-2,3]\n'+func)), {1:'red'});
    });
});

describe('The javascript analyzer', () => {
    it('is analyzing a function with while correctly', () => {
        let func = 'function f(x, y){\nlet a = x * y;\nlet b = x / y;\nlet c = a + b;'+
        'while (c > x*2)\ny = c + 2;\na = a - 2;\nreturn a;}';
        let subCode = getSubstitution(parseCode(func));
        assert.equal(subCode,'function f(x, y) {\n    while (x * y + x / y > x * 2)\n        y = x * y + x / y + 2;\n    return x * y - 2;\n}');});
    it('is analyzing a function with array member assignment correctly', () => {
        let func = 'function f(x, y) {\nlet a = 1;\nx[y + a] = 5;\nreturn x;}';
        let subCode = getSubstitution(parseCode(func));
        assert.equal(subCode,'function f(x, y) {\n    x[y + 1] = 5;\n    return x;\n}');    });
    it('is analyzing a function with local array member assignment correctly', () => {
        let func = 'function f(x) {\nlet a = [1,2,3];\nif(a[1] > x){\na[0] = 7;\nreturn a[0]/x;}\nreturn a[2];\n}';
        let subCode = getSubstitution(parseCode(func));
        assert.equal(subCode,'function f(x) {\n    if (2 > x) {\n        return 7 / x;\n    }\n    return 3;\n}');});
    it('is analyzing a function with local negative number correctly', () => {
        let func = 'function f(x){\nlet a=-5;\nreturn a;\n}';
        let subCode = getSubstitution(parseCode(func));
        assert.equal(subCode,'function f(x) {\n    return -5;\n}');});

});

function getSubstitution(code){
    let finalCode = substituteFunc(code.body);
    return revertCode(finalCode);
}

function getColors(code){
    let subCode = getSubstitution(code);
    let args = getArgs(code.body);
    return colorLines(subCode,args);
}
