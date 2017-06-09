/**
 * ****************************************************** *
 *                                                        *
 *                        ANALYZER                        *
 *                                                        *
 * ****************************************************** *
 * This library aims to:
 * 1) Access source code
 * 2) Detect dependencies tree and its properties
 * 
 * Necessary and sufficient info to include a function in the output:
 * 1) origin
 * 2) origin imports
 * 3) origin invoked functions
 * 4) origin exported functions
 * 5) origin private declared functions
 * 
 * Example 01
 * 
 * Analysis of index.js should prduce:
 * 1) Modules:
 *      - lib
 * 2) Declared functions: none
 * 3) Invoked functions:
 *      - name
 *      - doublePlusOne
 *      - console.log
 * 
 * Analysis of lib.js should produce:
 * 1) Modules: none
 * 2) Declared functions:
 *      - name (exported)
 *      - double (exported)
 *      - doublePlusOne (exported)
 *      - subX (since it is never used it should be excluded in final output)
 * 3) Invoked functions:
 *      - increment
 *      - double
 *      - addX
 */

import { readFile } from 'fs';
import { resolve } from 'path';
const esprima = require('esprima');
import { Observable, Subject, BehaviorSubject } from 'rxjs/Rx';

class Analyzer {
    declared: Observable<string> = new Observable();
    deps: Observable<string> = new Subject();
    dirPath: string;
    encoding: string;
    exported: Observable<string> = new Observable();
    files: Observable<string> = new Observable();
    imports: Observable<string> = new Observable();
    invoked: Observable<string> = new Observable();
    nodes: Observable<any> = new Observable();
    tree: BehaviorSubject<any> = new BehaviorSubject([]);

    constructor(dirPath: string, encoding: string = 'utf8') {
        this.dirPath = dirPath;
        this.encoding = encoding;

        this.createDepTree();
    }

    createDepTree() {
        this.files = this.deps
            .startWith('index')
            .map(dep => resolve(this.dirPath, dep) + '.js');

        this.files.subscribe(file => {
            this.analyzeFile(file);
        });

        this.tree.subscribe({
            next: (value) => {
                console.log('==== TREE:');
                console.info(value);
            }
        });

        return this;
    }

    analyzeFile(file) {
        this.scanNodes(file)
            .scanImports()
            .scanDeclared()
            .scanInvoked()
            .scanExported()
            .createSubscriptions();
    }

    addTreeElement(filename) {
        let snapshot = this.tree.getValue();
        const itemIndex = snapshot.findIndex(element => {
            return element.file === filename;
        });

        if (itemIndex > -1) {
            return;
        }

        snapshot.push({
            file: filename,
            imports: [],
            declared: [],
            invoked: [],
            exported: []
        });

        this.tree.next(snapshot);
    }

    feedTreeElement(category, value) {
        let snapshot = this.tree.getValue();

        snapshot[snapshot.length - 1][category].push(value);

        this.tree.next(snapshot);
    }

    scanNodes(filename) {
        this.addTreeElement(filename);

        this.nodes = Observable
            .from([filename])
            .flatMap(file =>{
                const readFileAsObservable = Observable.bindNodeCallback((
                    path: string,
                    encoding: string,
                    callback: (error: Error, buffer: Buffer) => void
                ) => readFile(path, encoding, callback));

                return  readFileAsObservable(file, this.encoding);
            }).flatMap(code => 
                Observable.fromEventPattern(handler => 
                    esprima.parse(code, { sourceType: 'module' }, handler)
                )
            ).share();
        
        return this;
    }

    scanImports() {
        this.imports = this.nodes
            .filter(node => node.type === 'ImportDeclaration')
            .map(node => node.source.value);

        return this;
    }

    scanInvoked() {
        this.invoked = this.nodes
            .filter(node => node.type === 'CallExpression' && node.callee.type === 'Identifier')
            .map(node => node.callee.name);

        return this;
    }

    scanDeclared() {
        this.declared = this.nodes
            .filter(node => node.type === 'FunctionDeclaration')
            .map(node => node.id.name);

        return this;
    }

    scanExported() {
        this.exported = this.nodes
            .filter(node => node.type === 'ExportNamedDeclaration')
            .map(node => node.declaration.id.name);

        return this;
    }


    createSubscriptions(){        
        this.declared.subscribe(value => {
            this.feedTreeElement('declared', value);
        });

        this.invoked.subscribe(value => {
            this.feedTreeElement('invoked', value);
        });

        this.exported.subscribe(value => {
            this.feedTreeElement('exported', value);
        });

        this.imports.subscribe(value => {
            this.feedTreeElement('imports', value);
            // this.deps.next(value);
        });

        return this;
    }
}

const analyzer = new Analyzer('./examples/fn/01/');