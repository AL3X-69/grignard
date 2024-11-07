import {Bond, BondType, SimpleBond} from "./bonds";
import {FabricText} from "fabric";
import {Coordinates} from "../graphics/geometry";

export class SimpleNode {
    atom: string;
    charge: number = 0;
    main: boolean = false;
    cycle: SimpleNode[] | null = null;
    _object: FabricText | undefined;
    _position: Coordinates | undefined;
    _treated: boolean = false;
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
