import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import { File } from 'babel-types';
import Crawler from './Crawler';    

export default class Evaluator {
    crawler: Crawler
    evaluatedAstSubject: Subject<File>

    constructor(crawler: Crawler) {
        this.crawler = crawler;
        this.evaluatedAstSubject = new Subject<File>();
    }

    getEvaluatedASTStream() {
        return this.crawler.getASTStream()
            .map(this.enrich.bind(this));
    }

    start(): void { 
        this.crawler.start();
    }

    enrich(ast: File): void {
        const collection = jscodeshift(ast);
        ast.map = {};
        // ast.program.body.forEach(this.needANameHere(ast.evaluation));

        collection
            .find(jscodeshift.FunctionDeclaration)
            .forEach(function (path) {
                ast.map[path.value.start] = 'create ' + path.value.id.name;
                ast.map[path.value.end] = 'close ' + path.value.id.name;                
            });
        
        collection
            .find(jscodeshift.CallExpression)
            .forEach(function (path) {
                ast.map[path.value.start] = 'call ' + path.value.callee.name;
            });
        
        collection
            .find(jscodeshift.ReturnStatement)
            .forEach(function (path) {
                ast.map[path.value.start] = 'return ' + path.value.argument.name;
            });
        
        console.log(ast.map);

        return ast;
    }

    needANameHere(evaluation) {
        const self = this;

        return function (node) {
            evaluation = self.functions(node, evaluation);
            evaluation = self.exports(node, evaluation);
            evaluation = self.assignments(node, evaluation);
            evaluation = self.invokations(node, evaluation);
            return evaluation;
        }
    }

    functions(node, evaluation, exported: boolean = false) { 
        if (node.type !== 'FunctionDeclaration') { 
            return evaluation;
        }

        console.log(node.id.name);

        evaluation[node.id.name] = {
            assigned: false,
            assignedCount: 0,
            invoked: false,
            invokedCount: 0,
            exported,
            sub: {}
        }

        node.body.body.forEach(this.needANameHere(evaluation[node.id.name].sub));

        return evaluation;
    }

    exports(node, evaluation) {
        if (node.type !== 'ExportNamedDeclaration' || !node.declaration) {
            return evaluation;
        }

        return this.functions(node.declaration, evaluation, true);
    }

    assignments(node, evaluation) {
        const self = this;

        if (node.type !== 'VariableDeclaration') {
            return evaluation;
        }

        node.declarations.forEach(declarationNode => { 
            console.log(declarationNode);

            if (declarationNode.init.type === 'CallExpression' && !!evaluation[declarationNode.init.callee.name]) { 
                evaluation[declarationNode.init.callee.name].invoked = true;
                evaluation[declarationNode.init.callee.name].invokedCount += 1;
                return evaluation;
            }

            if (declarationNode.init.type === 'Identifier' && !!evaluation[declarationNode.init.name]) {
                evaluation[declarationNode.init.name].assigned = true;
                evaluation[declarationNode.init.name].assignedCount += 1;
                return evaluation;

                // @TODO: create new evaluation key
            }

            return evaluation;
        });

        return evaluation;
    }

    invokations(node, evaluation) {
        if (node.type !== 'ExpressionStatement' || !evaluation[node.expression.callee.name]) {
            return evaluation;
        }

        evaluation[node.expression.callee.name].invoked = true;
        evaluation[node.expression.callee.name].invokedCount += 1;

        return evaluation;
    }
}
