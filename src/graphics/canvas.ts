import {Molecule} from "../objects/molecule.ts";
import {SimpleNode} from "../objects/nodes.ts";
import {fabric} from "fabric";
import {Bond} from "../objects/bonds.ts";
import {StaticCanvas} from "fabric/fabric-impl";

export interface SchemaOptions {
    geometry?: "flat" | "fischer" | "cram" | "haworth" | "newman",
    showCarbonAtoms?: boolean | "none" | "groups" | "end" | "full",
    showHydrogenAtoms?: boolean | "none" | "groups" | "compact" | "full",
    showLewisBonds?: boolean
}

const getOtherNode = (bond: Bond, node: SimpleNode) => bond.nodeA === node ? bond.nodeB : bond.nodeA;

const countHydrogen = (node: SimpleNode) => {
    let c = 0;
    for (let link of node.links) {
        const attachedNode = getOtherNode(link, node);
        if (attachedNode.atom === "H") c++;
    }
    return c;
}

const getBiggerCarbonChain = (bond: Bond | null, node: SimpleNode): {length: number, bond: Bond | null} => {
    const _processNode = (oldBond: Bond, n: SimpleNode, depth: number) => {
        if (n.atom !== "C") return depth;
        depth++;
        let max = depth;
        for (let link of n.links) {
            if (link !== oldBond) {
                max = Math.max(max, _processNode(link, getOtherNode(link, n), depth));
            }
        }
        return max;
    }

    let max = 0;
    let b = null;
    for (let link of node.links) {
        if (link !== bond) {
            const n = _processNode(link, getOtherNode(link, node), 0);
            if (n > max) {
                max = n;
                b = link;
            }
        }
    }

    return {
        length: max,
        bond: b
    };
}

export default class Canvas {
    canvas: StaticCanvas;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = new fabric.StaticCanvas(canvas);
    }

    private drawNode(node: SimpleNode, options: SchemaOptions, depth: number,
                     angle: number, onMainChain: boolean, bond: Bond | null) {
        // TODO: group detection
        const drawText = ((node.atom === "C" && (
            options.showCarbonAtoms === true
            || options.showCarbonAtoms === "full"
            || (options.showCarbonAtoms === "end" && (depth === 0 || node.links.length <= 1))
        )) || (node.atom === "H" && (
            options.showHydrogenAtoms === true
            || options.showHydrogenAtoms === "full"
        )) || !["H", "C"].includes(node.atom));

        if (drawText) {
            let s = node.atom;
            // TODO: Hydrogen number as indice
            if (options.showHydrogenAtoms === "compact") s += "H" + countHydrogen(node)
            const text = new fabric.Text(s);
            node._object = text;
            this.canvas.add(text);
        }

        // Bonds
        if (onMainChain) {
            const mainChainNext = getBiggerCarbonChain(bond, node);
            for (let link of node.links) {
                if (link === bond) continue;
                if (link === mainChainNext.bond) {}
            }
        }
    }

    draw = (molecule: Molecule, options?: SchemaOptions) => {
        this.drawNode(molecule.atoms[0], options || {}, 0, 0, true);
    }
}
