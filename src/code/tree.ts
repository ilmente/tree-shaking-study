import { node as jscsNode } from 'jscodeshift';
import { Scope } from './scope';
import { Node } from './node';

export default class Tree { 
    forest: Array<Scope[]> = []
    scopes: Scope[]
    declarations: Node[]
    usages: Node[]
    
    constructor(scopes: Scope[], declarations: Node[], usages: Node[]) { 
        this.scopes = scopes;
        this.declarations = declarations;
        this.usages = usages;
        
        this.init();
        this.populate();
        this.applyGlobalContext();
    }

    init() { 
        this.scopes
            .map(scope => {
                if (scope.isConsumed) return;

                const tree = this.scopes.reduce((path, node, nodeIndex) => {
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
                this.forest.push(tree);
            });
    }

    populate() { 
        this.forest.forEach(tree => {
            var prev = [];

            tree
                .map(scope => {
                    scope.register(this.declarations, this.usages)
                    return scope;
                })
                .reverse()
                .map(scope => {
                    scope.available = [
                        ...prev,
                        ...scope.declared
                    ];

                    prev = scope.available;
                    return scope;
                });
        });
    }

    applyGlobalContext() { 
        const length = this.forest.length - 1;
        const program = this.forest[length][0];

        this.forest.forEach((tree, index) => {
            if (length === index) return;

            tree.map(scope => {
                scope.available = [
                    ...program.declared,
                    ...scope.available
                ]
            });
        });
    }

    print() { 
        this.forest.forEach(tree => { 
            tree.forEach(scope => console.log(scope));
        });
    }

}
