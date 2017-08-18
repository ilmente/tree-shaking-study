import * as jscodeshift from 'jscodeshift';

export interface IScope { 
    start: number    
    end: number,
    scope: any[],
    usage: any[]
}

function concat(arrayA: any[], arrayB: any[]): any[] { 
    return arrayA.concat(arrayB);
}

function flatten(...arrays: Array<any[]>): any[] {
    return arrays.reduce(concat, []);
}

function getScope(node: jscodeshift.Node): IScope { 
    return {
        start: node.start,
        end: node.end,
        scope: [],
        usage: []
    }
}

const utils = {
    getScopes: function (): IScope[] {
        const program = this
            .find(jscodeshift.Program)
            .nodes()
            .map(getScope); 

        const functions = this
            .getFunctionDeclarationNodes()
            .map(getScope); 
        
        return flatten(
            program,
            functions
        );
    },

    getFunctionDeclarationNodes: function (): jscodeshift.Node[] { 
        return this
            .find(jscodeshift.FunctionDeclaration)
            .nodes();
    },

    getDeclarationIdentifierNodes: function (): jscodeshift.Node[] {
        const variableDeclarationIdentifierNodes = this
            .find(jscodeshift.VariableDeclaration)
            .nodes()
            .map(declarator => declarator.declarations)
            .reduce(concat, [])
            .map(declaration => declaration.id);

        const functionDeclarationNodes = this
            .getFunctionDeclarationNodes();
        
        const functionDeclarationIdentifierNodes = functionDeclarationNodes
            .map(declaration => declaration.id);

        const paramIdentifierNodes = functionDeclarationNodes
            .map(declaration => declaration.params)
            .reduce(concat, []);

        return flatten(
            variableDeclarationIdentifierNodes,
            functionDeclarationIdentifierNodes,
            paramIdentifierNodes
        );
    },

    getUsageIdentifierNodes: function (): jscodeshift.Node[] {
        const declarationIdentifierNodes = this
            .getDeclarationIdentifierNodes();

        return this
            .find(jscodeshift.Identifier)
            .nodes()
            .filter(identifier => !declarationIdentifierNodes.includes(identifier));
    }
}

export default function registerUtils(): void {
    jscodeshift.registerMethods(utils);
}

