import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {revertCode} from './code-analyzer';
import {substituteFunc} from './analyzer';
import {getArgs} from './analyzer';
import {colorLines} from './analyzer';


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
