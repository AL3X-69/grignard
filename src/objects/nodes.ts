import {Bond, BondType, SimpleBond} from "./bonds.ts";
import valence from "../chem/valence.ts";
import {fabric} from "fabric";

export class SimpleNode {
    atom: string;
    charge: number = 0;
    _object: fabric.Text | undefined;
    private _links: Bond[] = [];

    constructor(atom: string) {
        this.atom = atom;
    }

    get links(): Bond[] {
        return this._links;
    }

    private addLink(link: Bond) {
        this._links.push(link);
    }

    connectTo(node: SimpleNode, type?: BondType) {
        let link;
        switch (type) {
            case undefined:
            case "simple":
                link = new SimpleBond(this, node);
                break;
            case "double":
                link = new SimpleBond(this, node);
                break;
            case "triple":
                link = new SimpleBond(this, node);
                break;
        }
        this._links.push(link);
        node.addLink(link);
    }

    addHydrogen(n: number) {
        for (let i = 0; i < n; i++) {
            const hydrogen = new SimpleNode("H");
            this.connectTo(hydrogen);
        }
    }
}