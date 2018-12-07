import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {revertCode} from './code-analyzer';
import {substitute} from './substitutor';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let lines = codeToParse.split('\n');
        let finalCode = substituteFunc(lines, parsedCode.body);
        for(let i=0;i<finalCode.length;i++) {
            $('#ColoredCode').append('<div>'+finalCode[i]+'</div>');
        }

    });
});


function substituteFunc(codeLines, code){
    let args = {}; let newFunc = codeLines;
    for(let i=0; i<code.length;i++){
        if(code[i].type === 'FunctionDeclaration'){
            newFunc = substitute(codeLines, code[i]);
        }
        else{
            for(let j=0;j<code[i].expression.expressions.length;j++){
                let arg = code[i].expression.expressions[i];
                let name = arg.left.name;
                if(arg.right.type === 'Identifier')
                    args[name] = arg.right.name;
                else
                    args[name] = arg.right.raw;
            }
        }
    }
    return newFunc;
}