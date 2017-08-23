import { resolve } from 'path';
import * as babelTypes from 'babel-types';
import { BehaviorSubject, Observable, Subject } from 'rxjs/Rx';
import * as jscodeshift from 'jscodeshift';
import { isDeclaration, increaseReference } from './jscodeshift-util';
import Crawler from './crawler';

export default class Scanner {
    astStreamInput: Observable<babelTypes.File>
    astListStream: BehaviorSubject<babelTypes.File[]> = new BehaviorSubject([]);

    constructor(crawler: Crawler) { 
        this.astStreamInput = crawler.getASTStream();

        this.start();
    }

    /**
     * Launch cross AST stream analysis
     * 
     * >Don't cross the streams.
     * - Egon Spengler
     */
    start(): void {
        this.scanInputStream();

        this.astListStream.subscribe({
            next: ((astList: babelTypes.File[]) => {
                if (astList && astList.length > 0) {
                    console.info('Processing AST list...');
                }
            }),
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning cross module: level 2 completed');
            }
        });
    }

    scanInputStream(inputStream: Observable<babelTypes.File> = this.astStreamInput): void {
        const astStreamScanned: Observable<babelTypes.File> = Observable
            .from(this.astStreamInput)
            .map((ast: babelTypes.File) => {
                return this.scanDeclaration(ast);
            });
        
        astStreamScanned.subscribe({
            next: (ast: babelTypes.File) => {
                const astList = this.astListStream.getValue();

                astList.push(ast);
                this.astListStream.next(astList);
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Scanning cross module: level 1 completed');
            }
        });
    }

    /**
     * Add number of references to declarations in a given AST
     * @param ast
     * @param identifierName
     */
    scanDeclaration(ast: babelTypes.File, identifierName: string = ''): babelTypes.File {
        const astCollection: jscodeshift.Collection = jscodeshift(ast);
        const identifiers: Observable<jscodeshift.Identifier> = Observable.from(astCollection.find(jscodeshift.Identifier).__paths);

        identifiers.subscribe({
            next: (identifierNodePath) => {
                if (identifierName === '') {
                    identifierName = identifierNodePath.node.name;
                }

                if (!isDeclaration(identifierNodePath.parent)) {
                    astCollection
                        .find(jscodeshift.FunctionDeclaration, {
                            id: {
                                name: identifierName
                            }
                        })
                        .forEach(nodePath => {
                            increaseReference(nodePath);
                        });

                    astCollection
                        .find(jscodeshift.VariableDeclarator, {
                            id: {
                                name: identifierName
                            }
                        })
                        .forEach(nodePath => {
                            increaseReference(nodePath);
                        });
                }
            },
            error: (err: Error) => {
                console.error(err);
            },
            complete: () => {
                console.log('Identifiers stream completed');
            }
        });

        return astCollection.getAST();
    }
}