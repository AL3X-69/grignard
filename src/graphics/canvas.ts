import {Molecule} from "../objects/molecule";
import {SimpleNode} from "../objects/nodes";
import {Bond} from "../objects/bonds";
import {Canvas as FabricCanvas, Line, FabricText} from "fabric";
import {add, getNextPoint} from "./geometry";

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
        console.log("Tail call");
        console.log({node, options, depth, onMainChain, bond});
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

        if (node._position == null) node._position = {x: 0, y: 0};

        if (drawText) {
            let s = node.atom;
            // TODO: Hydrogen number as indice
            if (options.showHydrogenAtoms === "compact") s += "H" + countHydrogen(node)

            const text = new FabricText(s, {
                left: zero.x + node._position.x,
                top: zero.y + node._position.y
            });

            node._object = text;
            this.canvas.add(text);
        }

        // Bonds
        // main chain
        if (onMainChain) {
            let mainChainNext = null;
            for (let link of node.links) {
                const other = getOtherNode(link, node);
                if (link !== bond && other.main) {
                    mainChainNext = {
                        next: other,
                        bond: link
                    };
                    break;
                }
            }
            if (mainChainNext === null) { // end of main chain
                if (depth === 0) { // If only one atom, draw it
                    let s = node.atom;
                    // TODO: Hydrogen number as indice
                    if (options.showHydrogenAtoms === "compact") s += "H" + countHydrogen(node)

                    const text = new FabricText(s, {
                        left: zero.x + node._position.x,
                        top: zero.y + node._position.y,
                        fontSize: 16
                    });

                    node._object = text;
                    this.canvas.add(text);
                }
                return;
            }

            // TODO: fully handle options
            const angle = bond === null || bond._angle == undefined ? -120 : bond._angle * -1;
            const bondSize = options.showCarbonAtoms === true || options.showCarbonAtoms === "full" ? 20 : 30;
            let startPos = node._position;
            if (options.showHydrogenAtoms === true || options.showHydrogenAtoms === "full")
                startPos = add(startPos, getNextPoint({...node._position, angle: angle}, 5));
            const otherPos = getNextPoint({...node._position, angle: angle}, 30);
            const endPos = getNextPoint({...node._position, angle: angle}, bondSize);
            console.log("start", startPos, "end", endPos);
            const bondLine = new Line([
                zero.x + startPos.x,
                zero.y + startPos.y,
                zero.x + endPos.x,
                zero.y + endPos.y
            ], {
                hasControls: false,
                selectable: false,
                stroke: "#000000"
            });

            mainChainNext.next._position = otherPos;

            const newBond = mainChainNext.bond;
            newBond._object = bondLine;
            newBond._angle = angle;

            this.canvas.add(bondLine);
            this.drawNode(getOtherNode(mainChainNext.bond, node), options, depth + 1, true, newBond);
        }
        // groups
    }

    draw = (molecule: Molecule, options?: SchemaOptions) => {
        this.canvas.clear();
        this.drawNode(molecule.atoms[0], options || {}, 0, true, null);
    }
}
