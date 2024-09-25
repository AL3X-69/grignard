import {Molecule} from "../objects/molecule";
import {SimpleNode} from "../objects/nodes";
import {BondType} from "../objects/bonds";

const STANDARD_ATOMS = ["B", "C", "N", "O", "P", "S", "F", "Cl", "Br", "I"];

const findClosingParenthesis = (s: string, opi: number): number => {
    let c = 1;
    for (let i = opi + 1; i < s.length; i++) {
        const char = s[i];
        if (char === "(") c++;
        else if (char === ")") c--;
        if (c === 0) return i;
    }
    return -1;
}

interface GroupProcessingResult {
    atoms: SimpleNode[],
    parentBondType: BondType
}

const readNumber = (s: string, start: number): number => {
    let n = "";
    for (let i = start; i < s.length; i++) {
        let c = s.charAt(i);
        if (!isNaN(Number(c))) n += c;
        else break;
    }
    if (n === "") return NaN;
    return Number(n);
}

// TODO: Support chirality (3.3.2-3.3.4)
const processGroup = (s: string): GroupProcessingResult => {
    const atoms = [];
    const cycles: {[index: number]: SimpleNode} = {};
    let atom = null;
    let bondType: BondType = "simple";
    let parentBond: BondType = "simple";

    for (let i = 0; i < s.length; i++) {
        const c = s.charAt(i);

        if (c === "(") { // Reading group (recursive call)
            if (atom === null) throw new Error(
                "Error while parsing SMILES: Unexpected group, at least one atom is required before opening a branch");
            let closingParenthesis = findClosingParenthesis(s, i);
            const r = processGroup(s.substring(i + 1, closingParenthesis));
            atom.connectTo(r.atoms[0], r.parentBondType);
            i = closingParenthesis;
        } else if (!isNaN(Number(c)) || c === "%") { // Reading cycle number
            if (atom === null) throw new Error("Unexpected cycle number, number must be preceded by an atom");
            const n = c === "%" ? readNumber(s, i + 1) : Number(c);

            if (cycles[n] != undefined) {
                cycles[n].connectTo(atom)
            } else cycles[n] = atom;

            i += c === "%" ? n.toString().length : 0;
        } else if (c === "[") { // Reading non-organic atom
            // TODO: ignore isotopic notation
            const end = s.indexOf("]", i + 1);
            if (end === -1)
                throw new Error("Error while parsing SMILES: Expected closing ] but none have been found");
            const element = s.substring(i + 1, end);
            let name = element[0];
            if (isNaN(Number(element[1])) && element[1] === element[1].toLowerCase()) name += element[1];

            // find if element has a non-standard charge
            const chStart = Math.max(element.indexOf("+"), element.indexOf("-"));
            const sign = element.indexOf("-") > 0 ? -1 : 1;
            let charge = chStart > 0 ? sign : 0;
            if (chStart > 0 && chStart < element.length - 1) {
                // check if the charge use the +++ notation or the +3 notation
                if (!isNaN(Number(element[chStart + 1]))) {
                    charge = Number(element.substring(chStart + 1, element.length)) * sign;
                } else {
                    charge = (element.split(sign == 1 ? "+" : "-").length - 1) * sign;
                }
            }

            // find if element has hydrogen atoms attached
            let hn = 0;
            if (element[name.length] === "H") {
                hn = 1;
                if (!isNaN(Number(element[name.length + 1]))) {
                    let hEnd = chStart === -1 ? element.length - 1 : chStart;
                    if (hEnd === -1) hEnd = element.length - 1;
                    hn = Number(element.substring(name.length, hEnd));
                }
            }

            let _a = atom;
            atom = new SimpleNode(name);
            atom.charge = charge;
            atom.addHydrogen(hn);
            if (_a !== null) _a.connectTo(atom, bondType);
            else parentBond = bondType;
            atoms.push(atom);

            i += element.length + 1;
        } else if (STANDARD_ATOMS.includes(c)) {
            // Make the distinction between Bore and Brome, Carbon and Chlorine
            let name = c;
            if (c === "B" && s[i+1] === "r") name = "Br";
            if (c === "C" && s[i+1] === "l") name = "Cl";

            let _a = atom;
            atom = new SimpleNode(name);
            // TODO: auto hydrogen add (see SMILES reference)
            if (_a !== null) _a.connectTo(atom, bondType);
            else parentBond = bondType;
            atoms.push(atom);

            i += name.length - 1;
        } else if (c === "=") bondType = "double";
        else if (c === "#") bondType = "triple";
    }

    if (atoms.length === 0) throw new Error("Error while parsing SMILES: Empty group");

    return {
        atoms: atoms,
        parentBondType: parentBond
    };
}

export class SMILESParser {
    parse(s: string): Molecule {
        const r = processGroup(s);
        return new Molecule(r.atoms);
    }
}
