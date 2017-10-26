import * as jscodeshift from 'jscodeshift';

export interface IScope { 
    start: number    
    end: number,
    is: null,
    declared: any[],
    available: any[],
    used: any[]
}

function concat(arrayA: any[], arrayB: any[]): any[] { 
    return arrayA.concat(arrayB);
}

function flatten(...arrays: Array<any[]>): any[] {
    return arrays.reduce(concat, []);
}

function getScope(start: number, end: number): IScope { 
    return {
        start,
        end,
        is: null,
        declared: [],
        available: [],
        used: []
    }
}

function getScopeFromNode(node: jscodeshift.Node): IScope {
    return getScope(node.start, node.end);
}

const utils = {
    getScopes: function (): IScope[] {
        const program = this
            .find(jscodeshift.Program)
            .nodes()
            .map(getScopeFromNode); 

        const functions = this
            .getFunctionDeclarationNodes()
            .map(declaration => getScope(declaration.id.end, declaration.body.end));
        
        return flatten(
            program,
            functions
        );
    },

    getFunctionDeclarationNodes: function (): jscodeshift.Node[] {
        const functionDeclarations = this
            .find(jscodeshift.FunctionDeclaration)
            .nodes();
        
        const functionExpressions = this
            .find(jscodeshift.FunctionExpression)
            .nodes();

        return flatten(
            functionDeclarations,
            functionExpressions
        );
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

