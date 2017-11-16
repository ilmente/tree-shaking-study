import Node from './node';

export interface IScope {
    start: number
    end: number
}

export default class Scope implements IScope { 
    readonly start: number
    readonly end: number
    readonly declared: Node[] = []
    readonly used: Node[] = []
    available: Node[] = []
    isConsumed: boolean = false

    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }

    register(declarations: Node[], usages: Node[]) { 
        declarations.map(this.registerDeclaration.bind(this));
        usages.map(this.registerUsage.bind(this));

        this.available = [
            ...this.used
        ];
    }

    registerDeclaration(declaration: Node): Node { 
        if (!declaration.isConsumed && this.start <= declaration.start && this.end >= declaration.end) {
            declaration.consume();
            this.declared.push(declaration);
        }

        return declaration;
    }

    registerUsage(usage: Node): Node {
        if (!usage.isConsumed && this.start <= usage.start && this.end >= usage.end) {
            usage.consume();
            this.used.push(usage);
        }

        return usage;
    }

    consume() {
        this.isConsumed = true;
    }
}
