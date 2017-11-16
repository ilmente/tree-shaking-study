import { node as jscsNode } from 'jscodeshift';

export default class Node {
    readonly name: string
    readonly start: number
    readonly end: number
    readonly node: jscsNode
    isConsumed: boolean = false

    constructor(node: jscsNode) {
        this.name = node.name;
        this.start = node.start;
        this.end = node.end;
        this.node = node;
    }

    consume() {
        this.isConsumed = true;
    }
}
