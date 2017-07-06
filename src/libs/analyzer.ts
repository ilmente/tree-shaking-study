
import * as fs from 'fs';
import { dirname } from 'path';
import * as Rx from 'rxjs';
import * as babelTypes from 'babel-types';
import * as jscodeshift from 'jscodeshift';

export default class Analyzer {
    astStream: any

    constructor(astStream: any) {
        this.astStream = astStream;

        this.analyze();
    }

    analyze() { 
        this.astStream.subscribe(this.checkAst);
    }

    checkAst(ast) {
        const AST = jscodeshift(ast);
        AST
            .find(jscodeshift.FunctionDeclaration)
            .forEach(function (node) {
                console.log(node.value.id.name);
            });
        
        AST
            .find(jscodeshift.CallExpression)
            .forEach(function (node) {
                console.log(node);
            });
    }

}
