import Node from './node';

export interface IScope {
    start: number
    end: number
}

export default class Scope implements IScope { 
    readonly start: number
    readonly end: number
    declared: Node[] = []
    used: Node[] = []
    available: Node[] = []
    isConsumed: boolean = false

    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }

    registerDeclarations(declarations: Node[]): void { 
        declarations.map(declaration => {
            if (!declaration.isConsumed && this.start <= declaration.start && this.end >= declaration.end) {
                declaration.consume();
                this.declared.push(declaration);
                this.available.push(declaration);
            }

            return declaration;
        });
    }

    registerUsages(usages: Node[]): void {
        usages.map(usage => {
            usage.preserve();

            if (!usage.isConsumed && this.start <= usage.start && this.end >= usage.end) {
                usage.consume();
                this.used.push(usage);
            }

            return usage; 
        });    
    }
    
    registerAvailables(availables: Node[]): void {
        this.available = [
            ...this.available,
            ...availables
        ].sort(
            // desc sorting
            // from internal to external
            (a, b) => b.end - a.end
        );
    }

    consume() {
        this.isConsumed = true;
    }

    process(): Scope { 
        this.used.map(used => {
            const match = this.available
                .filter(node => node.name === used.name)
                .find((node, index) => index === 0); // get first
            
            if (match) {
                console.log(used.name, match.name);
                match.preserve();
            } else { 
                console.log(used.name);
            }

            return used;
        });  

        return this;
    }

}
