export {substitute};

const replaceFunc = {
    Identifier: replaceValsInIdentifier,
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

function replaceValsInBlockStatement(codeLines, code, vars){
    for(let i=0;i<code.body.length;i++){
        replaceLocalWithValues(codeLines, code.body[i], vars);
    }
}

function replaceValsInExpressionStatement(codeLines, code, vars){
    let endDiff = code.loc.end.column - code.expression.loc.end.column;
    replaceLocalWithValues(codeLines,code.expression,vars);
    code.loc.end.column = code.expression.loc.end.column + endDiff;
}

function replaceValsInVariableDeclaration(codeLines, code, vars){
    let arg = code.declarations[0];
    let endDiff = code.loc.end.column - arg.init.loc.end.column;
    replaceLocalWithValues(codeLines,arg.init,vars);
    code.loc.end.column = arg.init.loc.end.column + endDiff;
    let valueLoc = arg.init.loc;
    vars[arg.id.name] = getStringFromCode(codeLines,valueLoc.start.line, valueLoc.start.column, valueLoc.end.line, valueLoc.end.column);
    removeStringFromCode(codeLines,code.loc.start.line, code.loc.start.column, code.loc.end.line, code.loc.end.column);
}

function replaceValsInIdentifier(codeLines, code, vars){
    if(code.name in vars){
        let loc = code.loc;
        removeStringFromCode(codeLines, loc.start.line, loc.start.column, loc.end.line, loc.end.column);
        codeLines[loc.start.line - 1] = codeLines[loc.start.line - 1].slice(0, loc.start.column) + vars[code.name] + codeLines[loc.start.line - 1].slice(loc.start.column);
        loc.end.column += vars[code.name].length - (loc.end.column - loc.start.column);
        return true;
    }
}

function replaceValsInMemberExpression(codeLines, code, vars){
    let endDiff = code.loc.end.column - code.object.loc.end.column;
    let propDiff = code.property.loc.start.column - code.object.loc.end.column;
    replaceLocalWithValues(codeLines,code.object,vars);
    code.loc.end.column = code.object.loc.end.column + endDiff;
    let prevStart = code.property.loc.start.column;
    code.property.loc.start.column = code.object.loc.end.column + propDiff;
    code.property.loc.end.column += code.property.loc.start.column - prevStart;
    endDiff = code.loc.end.column - code.property.loc.end.column;
    replaceLocalWithValues(codeLines, code.property, vars);
    code.loc.end.column = code.property.loc.end.column + endDiff;
}

function replaceValsInBinaryExpression(codeLines, code, vars){
    let endDiff = code.loc.end.column - code.left.loc.end.column;
    let firstDiff = code.right.loc.start.column - code.left.loc.end.column;
    if(replaceLocalWithValues(codeLines, code.left, vars)){
        let line = code.loc.start.line - 1;
        codeLines[line] = codeLines[line].slice(0, code.left.loc.end.column) + ' ' + codeLines[line].slice(code.left.loc.end.column);
    }

    code.loc.end.column = code.left.loc.end.column + endDiff;
    let prevStart = code.right.loc.start.column;
    code.right.loc.start.column = code.left.loc.end.column + firstDiff;
    code.right.loc.end.column += code.right.loc.start.column - prevStart;
    endDiff = code.loc.end.column - code.right.loc.end.column;
    replaceLocalWithValues(codeLines, code.right, vars);
    code.loc.end.column = code.right.loc.end.column + endDiff;
}

function replaceValsInUnaryExpression(codeLines, code, vars){
    let endDiff = code.loc.end.column - code.argument.loc.end.column;
    replaceLocalWithValues(codeLines, code.argument, vars);
    code.loc.end.columnn = code.argument.loc.end.column + endDiff;
}

function replaceValsInReturnStatement(codeLines, code, vars){
    replaceLocalWithValues(codeLines, code.argument, vars);
}

function replaceValsInAssignmentExpression(codeLines, code, vars){
    let endDiff = code.loc.end.column - code.right.loc.end.column;
    replaceLocalWithValues(codeLines,code.right,vars);
    code.loc.end.column = code.right.loc.end.column + endDiff;
    if(getName(code.left) in vars) {
        updateVar(vars, code.left, getStringFromCode(
            codeLines, code.right.loc.start.line, code.right.loc.start.column, code.right.loc.end.line, code.right.loc.end.column));
        removeStringFromCode(codeLines, code.loc.start.line, code.loc.start.column, code.loc.end.line, code.loc.end.column);
    }
}

function replaceValsInIfStatement(codeLines, code, vars){
    let varsCopy = {};
    for (let i in vars)
        varsCopy[i] = vars[i];
    replaceLocalWithValues(codeLines, code.test,vars);
    replaceLocalWithValues(codeLines,code.consequent,varsCopy);
    if(code.alternate != null)
        replaceLocalWithValues(codeLines,code.alternate,vars);
}

function replaceValsInWhileStatement(codeLines, code, vars){
    let varsCopy = {};
    for (let i in vars)
        varsCopy[i] = vars[i];
    replaceLocalWithValues(codeLines, code.test,vars);
    replaceLocalWithValues(codeLines,code.body,varsCopy);
}


function replaceLocalWithValues(codeLines, code, vars){
    if(code.type === 'Literal' || code.type === 'UpdateExpression') return;
    let func = replaceFunc[code.type];
    return func(codeLines,code,vars);
}

function substitute(codeLines, func){
    //let localVars = createVarsMap(codeLines, func.body.body);
    replaceLocalWithValues(codeLines, func.body, {});
    return removeEmptyLines(codeLines);
}

function getStringFromCode(codeLines, startLine, startCol, endLine, endCol){
    let str = '';
    startLine--; endLine--;
    if(endLine > startLine){
        str += codeLines[startLine].substring(startCol);
        for(let i=startLine+1;i<endLine;i++)
            str += '\n'+codeLines[i]+'\n';
        str += codeLines[endLine].substring(0,endCol);
    }
    else
        str += codeLines[startLine].substring(startCol,endCol);

    return str;
}

function removeStringFromCode(codeLines, startLine, startCol, endLine, endCol){

    if(endLine>startLine) {
        codeLines[startLine - 1] = codeLines[startLine - 1].substring(0,startCol);
        for(let i=startLine;i<endLine - 1;i++)
            codeLines[i] = '';
        codeLines[endLine - 1] = codeLines[endLine - 1].substring(endCol);
    }
    else
        codeLines[startLine - 1] = codeLines[startLine - 1].replace(codeLines[startLine - 1].substring(startCol, endCol+1), '');
}

function removeEmptyLines(codeLines){
    let linesToRemove = [];
    for(let i=0;i<codeLines.length;i++){
        if(isEmpty(codeLines[i]))
            linesToRemove.push(i);
    }
    return codeLines.filter(function (value, index){return !linesToRemove.includes(index);});
}

function isEmpty(str){
    let toRemove = true;
    for(let j=0;j<str.length;j++){
        if(str.charAt(j) !== ' ' && str.charAt(j) !== '\t')
            toRemove = false;
    }
    return toRemove;
}

function getName(exp){
    switch(exp.type){
    case 'Identifier':
        return exp.name;
    default:
        return exp.object.name;
    }
}

function updateVar(vars, variable, value){
    if(variable.type === 'Identifier')
        vars[variable.name] = value;
    else{
        let arr = vars[variable.object.name];
        if(variable.property.type === 'Literal')
            arr[variable.property.raw] = value;
        else
            arr[variable.property.name] = value;
    }

}