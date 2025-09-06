import {SimpleNode} from "./nodes";
import {Selection} from "d3";

export type BondType = "simple" | "double" | "triple";

export abstract class Bond {
    nodeA: SimpleNode;
    nodeB: SimpleNode;
    _object?: Selection<SVGPathElement, unknown, null, undefined>;
    _angle?: number;

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
