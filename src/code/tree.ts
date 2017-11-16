import { node as jscsNode } from 'jscodeshift';
import Scope from './scope';
import Node from './node';

export default class scopePath { 
    scopePaths: Array<Scope[]> = []
    
    constructor(scopes: Scope[], declarations: Node[], usages: Node[]) { 
        this.createScopePaths(scopes);
        this.populateScopePaths(declarations, usages);
        this.applyGlobalContext();
    }

    createScopePaths(scopes: Scope[]) { 
        const scopeLastIndex = scopes.length - 1;

        scopes.map(scope => {
            if (scope.isConsumed) return;

            const scopePath = scopes.reduce((path, scope, scopeIndex) => {
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

            if (scopePath.length === 0) {
                scopePath.push(scope);
            }

            this.scopePaths.push(scopePath);
            return scope;
        });
    }

    populateScopePaths(declarations: Node[], usages: Node[]) { 
        this.scopePaths.map(scopePath => {
            var previouslyAvailable = [];

            return scopePath
                .map(scope => {
                    scope.register(declarations, usages)
                    return scope;
                })
                .reverse()
                .map(scope => {
                    scope.available = [
                        ...previouslyAvailable,
                        ...scope.declared
                    ];

                    previouslyAvailable = scope.available;
                    return scope;
                });
        });
    }

    applyGlobalContext() { 
        const length = this.scopePaths.length - 1;
        const program = this.scopePaths[length][0];

        this.scopePaths.map((scopePath, index) => {
            if (length === index) return;

            scopePath.map(scope => {
                scope.available = [
                    ...program.declared,
                    ...scope.available
                ]
            });
        });
    }

    print() { 
        this.scopePaths.forEach(scopePath => { 
            scopePath.forEach(console.log);
        });
    }

}
