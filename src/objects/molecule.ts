import {SimpleNode} from "./nodes.ts";

export class Molecule {
    atoms: SimpleNode[] = [];


    constructor(atoms: SimpleNode[]) {
        this.atoms = atoms;
    }
}