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
        ast.map2 = [];
        // ast.program.body.forEach(this.needANameHere(ast.evaluation));

        const a = collection
            .getScopes();
        
        collection
            .getUsageIdentifierNodes();
        
        collection
            .getUsageIdentifierNodes();

        console.log(a);

        return ast;
    }

}
