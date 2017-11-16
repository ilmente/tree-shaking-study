import { node as jscsNode } from 'jscodeshift';

export class Node {
    name: string = ''
    start: number
    end: number
    node: jscsNode = null
    consumed: boolean = false

    constructor(node: jscsNode) {
        this.name = node.name;
        this.start = node.start;
        this.end = node.end;
        this.node = node;
    }

    consume() {
        this.consumed = true;
    }

    get isConsumed(): boolean {
        return this.consumed;
    }
}

export function createNode(node: jscsNode): Node {
    return new Node(node);
}
