import { node as jscsNode } from 'jscodeshift';
import { Node } from './node';

export class Scope { 
    start: number
    end: number
    declared: Node[] = []
    available: Node[] = []
    used: Node[] = []
    consumed: boolean = false

    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }

    register(declarations: Node[], usages: Node[]) { 
        declarations.map(this.registerDeclaration.bind(this));
        usages.map(this.registerUsage.bind(this));

        // this.available = [
        //     ...this.used
        // ];
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
        this.consumed = true;
    }

    get isConsumed(): boolean {
        return this.consumed;
    }
}

export function createScope(node: jscsNode): Scope {
    return new Scope(node.start, node.end);
}

