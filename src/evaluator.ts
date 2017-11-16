import * as jscodeshift from 'jscodeshift';
import { Observable, Subject } from 'rxjs/Rx';
import { File } from 'babel-types';
import Crawler from './Crawler'; 
import { createNode } from './code/Node';   
import { createScope }  from './code/Scope';  
import Tree from './code/Tree';   

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

    // good lord, even if do not exist, 
    // please forgive me for the following code...
    enrich(ast: File): void {
        const collection = jscodeshift(ast);

        const scopes = collection
            .getScopes()
            .sort((a, b) => a.end - b.end)
            .map(createScope);
        
        const declarations = collection
            .getDeclarationIdentifierNodes()
            .map(createNode);
        
        const usages = collection
            .getUsageIdentifierNodes()
            .map(createNode);
        
        const tree = new Tree(scopes, declarations, usages);
        
        // scopes.sort((a, b) => a.end - b.end);

        // scopes.forEach(tree => console.log(tree));

        // scopes.forEach(sss => { 
        //     if (sss.is) return;

        //     var tree = scopes.reduce((sum, value, index) => {
        //         if (value.is) return sum;
        //         if (index === scopes.length - 1) return sum;

        //         if (sum.length === 0) { 
        //             sum.push(value);
        //             value.is = true;
        //             return sum;
        //         };

        //         const last = sum[sum.length - 1];

        //         if (value.start <= last.start && value.end >= last.end) { 
        //             sum.push(value);
        //             value.is = true;
        //         } 

        //         return sum;
        //     }, []);

        //     if (tree.length === 0) tree.push(sss);
        //     test.push(tree);
        // });

        // test.forEach(tree => { 
        //     tree.forEach(scope => {
        //         declarations.forEach(dec => {
        //             if (!dec.used && scope.start <= dec.start && scope.end >= dec.end) {
        //                 scope.declared.push(dec.name);
        //                 dec.used = true;
        //             }
        //         });

        //         usages.forEach(usage => {
        //             if (!usage.used && scope.start <= usage.start && scope.end >= usage.end) {
        //                 scope.used.push(usage.name);
        //                 usage.used = true;
        //             }
        //         });
        //     });

        //     var prev = [];

        //     tree.reverse().forEach(scope => {
        //         scope.available = [
        //             ...prev,
        //             ...scope.declared
        //         ];

        //         prev = scope.available;
        //     });
        // });

        // const program = test[test.length - 1][0];

        // test.forEach((tree, index) => {
        //     if (test.length - 1 === index) return;
            
        //     tree.map(scope => {
        //         scope.available = [
        //             ...program.declared,
        //             ...scope.available
        //         ]
        //     });
        // });

        tree.print();
        return ast;
    }

}
