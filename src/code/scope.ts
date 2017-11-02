import { BaseNode, Node } from './node';

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
        declarations.forEach(this.registerDeclaration);
        usages.forEach(this.registerUsage);

        this.available = [
            ...this.used
        ];
    }

    registerDeclaration(declaration: Node): void { 
        if (!declaration.isConsumed && this.start <= declaration.start && this.end >= declaration.end) {
            declaration.consume();
            this.declared.push(declaration);
        }
    }

    registerUsage(usage: Node): void {
        if (!usage.isConsumed && this.start <= usage.start && this.end >= usage.end) {
            usage.consume();
            this.used.push(usage);
        }
    }
}
