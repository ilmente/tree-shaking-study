import * as jscodeshift from 'jscodeshift';

function concat(arrayA: any[], arrayB: any[]): any[] { 
    return arrayA.concat(arrayB);
}

function flatten(...arrays: Array<any[]>): any[] {
    return arrays.reduce(concat, []);
}

function functionDeclarationsFilter(call, caller) { 
    if (call.value.callee && caller.value.id) {
        return call.value.callee.name === caller.value.id.name;
    }

    return false;
}

function statementDeclarationsFilter(statement, caller) { 
    if (statement.value.argument && caller.value.id) {
        return statement.value.argument.name === caller.value.id.name;
    }

    return false;
}

const utils = {
    markFunctions: function (): void {
        this
            .find(jscodeshift.CallExpression)
            .first('Function', functionDeclarationsFilter)
            .mark();
        
        this
            .find(jscodeshift.ReturnStatement)
            .first('Function', statementDeclarationsFilter)
            .mark();
        
        this
            .find(jscodeshift.ExportNamedDeclaration)
            .find(jscodeshift.Function)
            .mark();
    },

    shake: function (): string { 
        return this
            .find(jscodeshift.FunctionDeclaration)
            .filter(path => !path.keep)
            .remove();
    }
}

export default function registerUtils(): void {
    jscodeshift.registerMethods(utils);
}

