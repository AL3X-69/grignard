import {Molecule} from "../objects/molecule";
import {SimpleNode} from "../objects/nodes";
import {Bond} from "../objects/bonds";
import {Canvas as FabricCanvas, Line, FabricText} from "fabric";
import {getNextPoint} from "./geometry";

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

export class Canvas {
    canvas: FabricCanvas;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = new FabricCanvas(canvas);
    }

    private drawNode(node: SimpleNode, options: SchemaOptions, depth: number, onMainChain: boolean, bond: Bond | null) {
        const zero = {
            x: Math.round(this.canvas.width / 2),
            y: Math.round(this.canvas.height / 2)
        }

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

            const pos = {
                x: bond == null || bond._object == null ? 0 : bond._object.left
                    + (options.showCarbonAtoms === true || options.showCarbonAtoms === "full" ? 5 : 0),
                y: bond == null || bond._object == null ? 0 : bond._object.top
                    + (options.showCarbonAtoms === true || options.showCarbonAtoms === "full" ? 5 : 0)
            }

            const text = new FabricText(s, {
                left: zero.x + pos.x,
                top: zero.y + pos.y
            });

            node._position = pos;
            node._object = text;
            this.canvas.add(text);
        }

        // Bonds
        // main chain
        if (onMainChain) {
            const mainChainNext = getBiggerCarbonChain(bond, node);
            if (mainChainNext.bond === null) return; // end of main chain

            const other = bond === null ? null : getOtherNode(bond, node);
            const angle = bond === null || bond._angle == undefined ? 30 : bond._angle * -1;
            const bondSize = options.showCarbonAtoms === true || options.showCarbonAtoms === "full" ? 20 : 30;
            const otherPos = other == null || other._position == null ? {x: 0, y: 0} : other._position;
            const startPos = {
                x: otherPos.x + (options.showCarbonAtoms === true || options.showCarbonAtoms === "full" ?
                    getNextPoint({...otherPos, angle: angle}, 5).x : 0),
                y: otherPos.y + (options.showCarbonAtoms === true || options.showCarbonAtoms === "full" ?
                    getNextPoint({...otherPos, angle: angle}, 5).y : 0)
            }
            const endPos = getNextPoint({...otherPos, angle: angle}, bondSize);

            const bondLine = new Line([
                zero.x + startPos.x,
                zero.y + startPos.y,
                zero.x + endPos.x,
                zero.y + endPos.y
            ]);

            const newBond = mainChainNext.bond;
            newBond._object = bondLine;
            newBond._angle = angle;

            this.drawNode(getOtherNode(mainChainNext.bond, node), options, depth + 1, true, newBond);
        }
        // groups
    }

    draw = (molecule: Molecule, options?: SchemaOptions) => {
        this.drawNode(molecule.atoms[0], options || {}, 0, true, null);
    }
}
