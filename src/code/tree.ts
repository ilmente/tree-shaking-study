import { node as jscsNode } from 'jscodeshift';
import { Scope, createScope } from './scope';

export class Tree { 
    scopes: Scope[]
    paths: Array<Scope[]> = []
    
    constructor(scopes: jscsNode[]) { 
        this.scopes = scopes.map(createScope);
        this.init();
    }

    init() { 
        this
            .scopes
            .forEach(scope => {
                if (scope.isConsumed) return;

                let tree = this.scopes.reduce((path, node, nodeIndex) => {
                    if (node.isConsumed || nodeIndex === this.scopes.length - 1) return path;

                    if (path.length === 0) {
                        path.push(node);
                        node.consume();
                        return path;
                    };

                    const previousNode = path[path.length - 1];

                    if (node.start <= previousNode.start && node.end >= previousNode.end) {
                        path.push(node);
                        node.consume();
                    }

                    return path;
                }, []);

                if (tree.length === 0) tree.push(scope);
                this.paths.push(tree);
            });
    }

}
