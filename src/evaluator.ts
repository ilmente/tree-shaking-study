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

    // good lord, even if do not exist, 
    // please forgive me for the following code...
    enrich(ast: File): void {
        const collection = jscodeshift(ast);
        ast.map = {};
        ast.map2 = [];

        const test = [];

        const scopes = collection
            .getScopes();
        
        const declarations = collection
            .getDeclarationIdentifierNodes();
        
        const usages = collection
            .getUsageIdentifierNodes();
        
        scopes.sort((a, b) => a.end - b.end);

        scopes.forEach(sss => { 
            if (sss.is) return;

            var tree = scopes.reduce((sum, value, index) => {
                if (value.is) return sum;
                if (index === scopes.length - 1) return sum;

                if (sum.length === 0) { 
                    sum.push(value);
                    value.is = true;
                    return sum;
                };

                const last = sum[sum.length - 1];

                if (value.start <= last.start && value.end >= last.end) { 
                    sum.push(value);
                    value.is = true;
                } 

                return sum;
            }, []);

            if (tree.length === 0) tree.push(sss);
            test.push(tree);
        });

        test.forEach(tree => { 
            tree.forEach(scope => {
                declarations.forEach(dec => {
                    if (!dec.used && scope.start <= dec.start && scope.end >= dec.end) {
                        scope.available.push(dec.name);
                        dec.used = true;
                    }
                });

                usages.forEach(usage => {
                    if (!usage.used && scope.start <= usage.start && scope.end >= usage.end) {
                        scope.usage.push(usage.name);
                        usage.used = true;
                    }
                });
            });

            var prev = [];

            tree.reverse().forEach(scope => {
                var merge = [
                    ...prev,
                    ...scope.available
                ];

                scope.available = merge.reduce((newm, val) => {
                    if (!newm.includes(val)) newm.push(val);
                    return newm
                }, []);

                prev = scope.available;
            });
        });

        test.forEach(tree => console.log(tree));
        return ast;
    }

}
