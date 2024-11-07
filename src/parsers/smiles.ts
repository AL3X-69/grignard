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
// TODO: Support aromatic rings
const processGroup = (s: string, main: boolean): GroupProcessingResult => {
    const atoms = [];
    const cycles: {[index: number]: SimpleNode[]} = {};
    let currentCycle: number | null = null;
    let atom = null;
    let bondType: BondType = "simple";
    let parentBond: BondType = "simple";

    for (let i = 0; i < s.length; i++) {
        const c = s.charAt(i);

        if (c === "(") { // Reading group (recursive call)
            if (atom === null)
                throw new Error("Unexpected group, at least one atom is required before opening a branch");
            let closingParenthesis = findClosingParenthesis(s, i);
            const r = processGroup(s.substring(i + 1, closingParenthesis), false);
            atom.connectTo(r.atoms[0], r.parentBondType);
            i = closingParenthesis;
        } else if (!isNaN(Number(c)) || c === "%") { // Reading cycle number
            if (atom === null) throw new Error("Unexpected cycle number, number must be preceded by an atom");
            const n = c === "%" ? readNumber(s, i + 1) : Number(c);

            if (cycles[n] != undefined) {
                if (cycles[n].length < 3) throw new Error("Invalid cycle configuration: not enough atom")
                for (const a of cycles[n]) a.cycle = cycles[n];
                currentCycle = null;
                cycles[n][0].connectTo(atom)
            } else {
                cycles[n] = [atom];
                currentCycle = n;
            }

            i += c === "%" ? n.toString().length : 0;
        } else if (c === "[") { // Reading non-organic atom
            const end = s.indexOf("]", i + 1);
            if (end === -1)
                throw new Error("Expected closing ] but none have been found");
            const element = s.substring(i + 1, end);
            let name = element.replace(/[^A-GI-Za-z]+/g, "");
            let [isotope, tailInfo] = s.split(/[A-GI-Za-z]+/);

            if (name === "" && tailInfo.startsWith("H")) {
                name = "H";
                tailInfo = tailInfo.substring(1);
            }

            if (tailInfo.indexOf("+") > 0 && tailInfo.indexOf("-") > 0)
                throw new Error("Both a positive and negative charge are specified for non-normal atom");

            let hydrogen = null;
            const chStart = Math.max(tailInfo.indexOf("+"), tailInfo.indexOf("-"));
            if (tailInfo.startsWith("H")) hydrogen = chStart === 1 ? 1 : Number(s.substring(1).replace(/[+-].+$/, ""));
            else if (tailInfo.indexOf("H") > 0) throw new Error("Hydrogen at wrong position in non-normal atom");

            const chargeInfo = tailInfo.substring(chStart);
            const q = chargeInfo[0] === "+" ? 1 : -1;
            const signAmount = chargeInfo.split(chargeInfo[0]).length - 1;
            const charge = q * (signAmount > 1 ? signAmount : Number(chargeInfo.substring(1)));

            let _a = atom;
            atom = new SimpleNode(name);
            atom.charge = charge;
            atom.main = main;
            if (hydrogen) atom.addHydrogen(hydrogen);
            if (_a !== null) _a.connectTo(atom, bondType);
            // TODO: save isotope
            else parentBond = bondType;
            atoms.push(atom);

            if (currentCycle !== null) cycles[currentCycle].push(atom);

            i += element.length + 1;
        } else if (STANDARD_ATOMS.includes(c)) {
            // Make the distinction between Bore and Brome, Carbon and Chlorine
            let name = c;
            if (c === "B" && s[i+1] === "r") name = "Br";
            if (c === "C" && s[i+1] === "l") name = "Cl";

            let _a = atom;
            atom = new SimpleNode(name);
            atom.main = main;
            // TODO: auto hydrogen add (see SMILES reference)
            if (_a !== null) _a.connectTo(atom, bondType);
            else parentBond = bondType;
            atoms.push(atom);

            if (currentCycle !== null) cycles[currentCycle].push(atom);

            i += name.length - 1;
        } else if (c === "=") bondType = "double";
        else if (c === "#") bondType = "triple";
    }

    if (atoms.length === 0) throw new Error("Empty group");

    return {
        atoms: atoms,
        parentBondType: parentBond
    };
}

export class SMILESParser {
    parse(s: string): Molecule {
        const r = processGroup(s, true);
        return new Molecule(r.atoms);
    }
}
