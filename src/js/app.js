import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {revertCode} from './code-analyzer';
import {substitute} from './substitutor';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        $('#ColoredCode').empty();
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let finalCode = substituteFunc(parsedCode.body);
        let codeStr = revertCode(finalCode);
        let args = getArgs(parsedCode.body);
        let colors = colorLines(codeStr,args);
        let lines = codeStr.split('\n');
        for(let i=0;i<lines.length;i++) {
            let start = '<div';
            (i in colors) ? start += ' style="background-color:' + colors[i] + ';">': start += '>';
            $('#ColoredCode').append(start+lines[i]+'</div>');
        }

    });
});


function substituteFunc(code){
    for(let i=0; i<code.length;i++) {
        if (code[i].type === 'FunctionDeclaration') {
            return substitute(code[i]);
        }
    }
}

function getArgs(code){
    let args = {};
    for(let i=0; i<code.length;i++){
        if(code[i].type === 'FunctionDeclaration') continue;
        else{
            for(let j=0;j<code[i].expression.expressions.length;j++){
                let arg = code[i].expression.expressions[j];
                let name = arg.left.name;
                if(arg.right.type === 'Identifier')
                    args[name] = arg.right.name;
                else
                    args[name] = arg.right.raw;
            }
        }
    }
    return args;
}

function colorLines(func,args){
    let lines = func.split('\n');
    let colors = {};
    let green = false;
    for(let i=0;i<lines.length;i++){
        green = processLine(lines[i],i,green,args,colors);
    }
    return colors;
}

function processLine(line,index,green,args,colors){
    if(line.includes('if (') && !line.includes('else if (')){
        green = determineColor(line,args);
        colors[index] = green? 'green' : 'red';
        return green;
    }
    return processElseIf(line,index,green,args,colors);

}

function processElseIf(line,index,green,args,colors){
    if(line.includes('else if (')){
        if(green)
            colors[index] = 'red';
        else {
            green = determineColor(line,args);
            colors[index] = green? 'green' : 'red';
        }
        //return green;
    }
    return green;
}

/*function processElse(line,index,green,colors){
    if(line.includes('else')){
        green?
            colors[index] = 'red' : colors[index] = 'green';
    }
    return green;
}*/

function determineColor(line,args){
    let cond = line.substring(line.indexOf('if (') + 4, line.lastIndexOf(')'));
    let condArr = cond.split(' ');
    Object.keys(args).forEach(function(key) {
        for(let i=0;i<condArr.length;i++){
            if(condArr[i] === key)
                condArr[i] = args[key];
        }
    });
    return eval(condArr.join(' '));
}