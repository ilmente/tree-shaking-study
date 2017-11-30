import { node as jscsNode } from 'jscodeshift';
import Scope from './scope';
import Node from './node';

export default class Tree { 
    tree: Array<Scope[]> = []
    
    constructor(scopes: Scope[], declarations: Node[], usages: Node[]) { 
        this.createTree(scopes);
        this.populateTree(declarations, usages);
        this.applyGlobalContext();
    }

    createTree(scopes: Scope[]) { 
        const scopeLastIndex = scopes.length - 1;

        scopes.map(scope => {
            if (scope.isConsumed) return;

            const branch = scopes.reduce((path, scope, scopeIndex) => {
                if (scope.isConsumed || scopeIndex === scopeLastIndex) return path;

                if (path.length === 0) {
                    path.push(scope);
                    scope.consume();
                    return path;
                };

                const previousScopeiousScope = path[path.length - 1];

                if (scope.start <= previousScopeiousScope.start && scope.end >= previousScopeiousScope.end) {
                    path.push(scope);
                    scope.consume();
                }

                return path;
            }, []);

            if (branch.length === 0) {
                branch.push(scope);
            }

            this.tree.push(branch);
            return scope;
        });
    }

    populateTree(declarations: Node[], usages: Node[]) { 
        this.tree.map(branch => {
            var previouslyAvailable = [];

            return branch
                .map(scope => {
                    scope.registerDeclarations(declarations);
                    scope.registerUsages(usages);
                    return scope;
                })
                .reverse()
                .map(scope => {
                    scope.registerAvailables(previouslyAvailable);
                    previouslyAvailable = scope.available;
                    return scope;
                });
        });
    }

    applyGlobalContext() { 
        const programBranchIndex = this.tree.length - 1;
        const globalScope = this.tree[programBranchIndex][0];

        this.tree.forEach((branch, branchIndex) => {
            if (programBranchIndex === branchIndex) return;

            branch.map(scope => {
                scope.registerAvailables(globalScope.declared);
                return scope;
            });
        });
    }

    process(collection) {
        this.tree.forEach(branch => {
            branch.forEach(scope => scope.process());
        });
    }

    print() { 
        this.tree.forEach(branch => { 
            branch.forEach(console.log);
        });
    }

}
