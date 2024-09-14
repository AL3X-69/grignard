import {SimpleNode} from "./nodes";

export class Molecule {
    atoms: SimpleNode[] = [];


    constructor(atoms: SimpleNode[]) {
        this.atoms = atoms;
    }
}
