import { Molecule } from "../objects/molecule";
import { SimpleNode } from "../objects/nodes";
import { Bond } from "../objects/bonds";
import { createLine, getNextPoint } from "./geometry";
import { line, select, Selection } from "d3";

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

export class Canvas {
    canvas: Selection<HTMLCanvasElement, unknown, null, undefined>;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = select(canvas);
    }

    private drawNode(node: SimpleNode, options: SchemaOptions, depth: number, onMainChain: boolean, bond: Bond | null) {
        if (node._treated) return;
        console.log("Tail call", depth);
        // console.log({node, options, depth, onMainChain, bond});
        const zero = {
            x: Math.round(this.canvas.node()!.width / 2),
            y: Math.round(this.canvas.node()!.height / 2)
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

        if (node._position == null) node._position = { x: 0, y: 0 };

        if (drawText) {
            let s = node.atom;
            // TODO: Hydrogen number as indice
            if (options.showHydrogenAtoms === "compact") s += "H" + countHydrogen(node);

            const text = this.canvas.append("text")
                .attr("x", zero.x + node._position.x - 4)
                .attr("y", zero.y + node._position.y - 8)
                .attr("fontSize", 16)
                .attr("textAlign", "center")
                .attr("fontFamily", "sans-serif")
                .text(s);

            node._object = text;
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
                    if (options.showHydrogenAtoms === "compact") s += "H" + countHydrogen(node);

                    const text = this.canvas.append("text")
                        .attr("x", zero.x + node._position.x)
                        .attr("y", zero.y + node._position.y)
                        .attr("fontSize", 16)
                        .attr("fontFamily", "sans-serif")
                        .text(s);

                    node._object = text;
                }
                return;
            }

            // TODO: fully handle options

            // compute angle
            let angle;
            if (node.cycle) {
                let absoluteAngle = 2 * Math.PI / node.cycle.length
                if (bond === null || getOtherNode(bond, node).cycle === null) absoluteAngle /= -2;
                console.log(absoluteAngle);
                angle = (bond === null || bond._angle == undefined ? 0 : bond._angle) - absoluteAngle;
            } else angle = bond === null || bond._angle == undefined ? Math.PI / 6 : bond._angle * -1;
            console.log(angle);

            let bondSize = 30;
            let startOffset = 0;
            if (node.atom !== "C" || (options.showCarbonAtoms === true || options.showCarbonAtoms === "full")) {
                bondSize -= 8;
                startOffset = 8;
            }
            if (mainChainNext.next.atom !== "C" || (options.showCarbonAtoms === true
                || options.showCarbonAtoms === "full")) bondSize -= 8;

            let nodePos = node._position;
            let startPos = getNextPoint({ ...nodePos, angle: angle }, startOffset);
            const otherPos = getNextPoint({ ...nodePos, angle: angle }, 30);
            const endPos = getNextPoint({ ...startPos, angle: angle }, bondSize);


            const bondLine = createLine(startPos, endPos);

            mainChainNext.next._position = otherPos;

            const newBond = mainChainNext.bond;
            newBond._object = this.canvas.append("path")
            .attr("d", bondLine)
            .attr("stroke", "black");
            newBond._angle = angle;

            node._treated = true;
            this.drawNode(getOtherNode(mainChainNext.bond, node), options, depth + 1, true, newBond);
        }

        // groups
    }

    draw = (molecule: Molecule, options?: SchemaOptions) => {
        this.canvas.select("*").remove();
        this.drawNode(molecule.atoms[0], options || {}, 0, true, null);
    }
}
