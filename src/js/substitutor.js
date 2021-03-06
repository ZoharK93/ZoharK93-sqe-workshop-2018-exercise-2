export {substitute};

const replaceFunc = {
    Identifier: replaceValsInIdentifier,
    ArrayExpression: replaceValsInArrayExpression,
    BlockStatement: replaceValsInBlockStatement,
    ExpressionStatement: replaceValsInExpressionStatement,
    VariableDeclaration: replaceValsInVariableDeclaration,
    BinaryExpression: replaceValsInBinaryExpression,
    UnaryExpression: replaceValsInUnaryExpression,
    MemberExpression: replaceValsInMemberExpression,
    ReturnStatement: replaceValsInReturnStatement,
    AssignmentExpression: replaceValsInAssignmentExpression,
    IfStatement: replaceValsInIfStatement,
    WhileStatement: replaceValsInWhileStatement
};

function replaceValsInBlockStatement(code, vars){
    for(let i=0;i<code.body.length;i++){
        code.body[i] = replaceLocalWithValues(code.body[i], vars);
        if(code.body[i] == null) delete code.body[i];
    }
    code.body = code.body.filter(value => Object.keys(value).length !== 0);
    return code;
}

function replaceValsInArrayExpression(code, vars){
    for(let i=0;i<code.elements.length;i++){
        code.elements[i] = replaceLocalWithValues(code.elements[i], vars);
    }
    return code;
}

function replaceValsInExpressionStatement(code, vars){
    code.expression = replaceLocalWithValues(code.expression,vars);
    if(code.expression == null) {delete code.expression; return null;}
    return code;
}

function replaceValsInVariableDeclaration(code, vars){
    let arg = code.declarations[0];
    arg.init = replaceLocalWithValues(arg.init,vars);
    vars[arg.id.name] = arg.init;
    return null;
}

function replaceValsInIdentifier(code, vars){
    if(code.name in vars){
        code = vars[code.name];
    }
    return code;
}

function replaceValsInMemberExpression(code, vars){
    let name = code.object.name;
    if(name in vars){
        code = vars[name].elements[code.property.value];
    }
    return code;
}

function replaceValsInBinaryExpression(code, vars){
    code.left = replaceLocalWithValues(code.left, vars);
    code.right = replaceLocalWithValues(code.right, vars);
    return calculate(code);
}

function replaceValsInUnaryExpression(code, vars){
    code.argument = replaceLocalWithValues(code.argument, vars);
    return code;
}

function replaceValsInReturnStatement(code, vars){
    if(code.argument != null)
        code.argument = replaceLocalWithValues(code.argument, vars);
    return code;
}

function replaceValsInAssignmentExpression(code, vars){
    code.right = replaceLocalWithValues(code.right,vars);
    let arg = code.left;
    if(getName(arg) in vars) {
        if (arg.type === 'Identifier')
            vars[arg.name] = code.right;
        else
            vars[arg.object.name].elements[arg.property.value] = code.right;
        return null;
    }
    else if (arg.type === 'MemberExpression')
        arg.property = replaceLocalWithValues(arg.property,vars);
    return code;
}

function replaceValsInIfStatement(code, vars){
    let varsCopy = {};
    for (let i in vars)
        varsCopy[i] = vars[i];
    code.test = replaceLocalWithValues(code.test,vars);
    code.consequent = replaceLocalWithValues(code.consequent,varsCopy);
    if(code.alternate != null)
        code.alternate = replaceLocalWithValues(code.alternate,vars);
    return code;
}

function replaceValsInWhileStatement(code, vars){
    let varsCopy = {};
    for (let i in vars)
        varsCopy[i] = vars[i];
    code.test = replaceLocalWithValues(code.test,vars);
    code.body = replaceLocalWithValues(code.body,varsCopy);
    return code;
}


function replaceLocalWithValues(code, vars){
    if(code.type === 'Literal' || code.type === 'UpdateExpression') return code;
    let func = replaceFunc[code.type];
    return func(code,vars);
}

function substitute(func){
    replaceLocalWithValues(func.body, {});
    return func;

}

function getName(exp){
    switch(exp.type){
    case 'Identifier':
        return exp.name;
    default:
        return exp.object.name;
    }
}

function calculate(binexp){
    if(binexp.left.type === 'BinaryExpression') binexp.left = calculate(binexp.left);
    if(binexp.right.type === 'BinaryExpression') binexp.right = calculate(binexp.right);
    if(binexp.left.type === 'Literal' && binexp.right.type === 'Literal')
        return calcBothLit(binexp);
    return binexp;
}

function calcBothLit(binexp){
    let left = binexp.left; let right = binexp.right; let op = binexp.operator;
    let val = eval(left.raw + ' ' + op + ' ' + right.raw);
    return {'type': 'Literal', 'value': val, 'raw': val.toString()};
}

