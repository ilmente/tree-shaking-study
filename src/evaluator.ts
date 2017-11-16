import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import { File } from 'babel-types';
import Crawler from './Crawler'; 
import Node from './code/Node';   
import Scope, { IScope } from './code/Scope';  
import Tree from './code/Tree';   

export default class Evaluator {
    crawler: Crawler
    evaluatedAstSubject: Subject<File>

    constructor(crawler: Crawler) {
        this.crawler = crawler;
        this.evaluatedAstSubject = new Subject<File>();
    }

    getEvaluatedASTStream() {
        return this.crawler
            .getASTStream()
            .map(this.enrich.bind(this));
    }

    start(): void { 
        this.crawler.start();
    }

    createNode(node: jscodeshift.Node): Node { 
        return new Node(node);
    }

    castScope(scope: IScope): Scope {
        return new Scope(scope.start, scope.end);
    }

    enrich(ast: File): void {
        const collection = jscodeshift(ast);
        const scopes = collection.getScopes().map(this.castScope);
        const declarations = collection.getDeclarationIdentifierNodes().map(this.createNode);
        const usages = collection.getUsageIdentifierNodes().map(this.createNode);
        const tree = new Tree(scopes, declarations, usages);

        tree.print();

        return ast;
    }

}
