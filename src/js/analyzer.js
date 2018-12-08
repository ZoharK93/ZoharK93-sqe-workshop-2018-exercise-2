import {substitute} from './substitutor';

export {substituteFunc};
export {getArgs};
export {colorLines};


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
        else if(code[i].expression.type === 'AssignmentExpression')
            getArgsFromExp(code[i].expression,args);
        else
            for(let j=0;j<code[i].expression.expressions.length;j++)
                getArgsFromExp(code[i].expression.expressions[j],args);

    }
    return args;
}

function getArgsFromExp(arg,args){
    let name = arg.left.name;
    if(arg.right.type === 'Literal')
        args[name] = arg.right.raw;
    else if (arg.right.type === 'UnaryExpression')
        args[name] = -arg.right.argument.value;
    else
        args[name] = arg.right.elements.map(e => e.value);

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
            else if(condArr[i].indexOf('[') !== -1 && condArr[i].substring(0,condArr[i].indexOf('[')) === key){
                condArr[i] = args[key][Number(condArr[i].substring(condArr[i].indexOf('[') + 1,condArr[i].indexOf(']')))];
            }
        }
    });
    return eval(condArr.join(' '));
}