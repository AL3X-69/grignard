import {SimpleNode} from "./nodes.ts";
import {fabric} from "fabric";

export type BondType = "simple" | "double" | "triple";

export abstract class Bond {
    nodeA: SimpleNode;
    nodeB: SimpleNode;
    _object: fabric.Text | undefined;

    protected constructor(nodeA: SimpleNode, nodeB: SimpleNode) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
    }

    abstract type(): BondType;
    abstract weight(): number;

    isBondLinkedToAtom(atom: string) {
        return this.nodeA.atom == atom || this.nodeB.atom == atom;
    }
}

export class SimpleBond extends Bond {
    constructor(nodeA: SimpleNode, nodeB: SimpleNode) {
        super(nodeA, nodeB);
    }

    type(): BondType {
        return "simple";
    }

    weight(): number {
        return 1;
    }
}