import {Token} from "../parsers";

const SMILES_CHARACTERS = {
    ATOM_DATA_BEGIN: "[",
    ATOM_DATA_END: "]",
    ATOM_WILDCARD: "*",
    ATOM_NAME: /([A-Z][a-z])/,
    SINGLE_BOND: "-",
    DOUBLE_BOND: "=",
    TRIPLE_BOND: "#",
    QUADRUPLE_BOND: "$",
    AROMATIC_BOND: ":",
    FAKE_BOND: ".",
    RING_BOND_TWO_DIGIT_NO_PREFIX: "%",
    BRANCH_BEGIN: "(",
    BRANCH_END: ")",
    CLOCKWISE_ROT: "@@",
    ANTICLOCKWISE_ROT: "@",
    UP_BOND: "/",
    DOWN_BOND: "\\"
};

type SmilesTokenType = keyof typeof SMILES_CHARACTERS;

interface SmilesToken extends Token {
    type: SmilesTokenType
}

export class SmilesParser {
    /**
     * Sanitize the provided string according SMILES notation.
     * SMILES string pass this function before being tokenized
     * @param s the string to sanitize
     * @return the sanitized string
     */
    private sanitize = (s: string) => s.replace(" ", "");

    /**
     * Tokenize the string. String must be sanitized before going through this function
     * @param s the string to tokenize
     * @return the tokens
     */
    private tokenize = (s: string): SmilesToken[] => {
        const tokens: SmilesToken[] = [];
        for (const char of s) {
            let type: SmilesTokenType | null = null;
            for (const [t, v] of Object.entries(SMILES_CHARACTERS)) {
                if (char === v || (Array.isArray(v) && v.includes(char)) || (v instanceof RegExp && v.test(char))) {
                    type = t as SmilesTokenType;
                    break;
                }
            }
            if (type === null) throw Error("Unrecognised token: " + char);

            if (type === "ATOM_NAME" && char === char.toLowerCase() && tokens[-1].type === "ATOM_NAME") {
                tokens[-1].value += char;
            } else tokens.push({
                value: char,
                type: type
            });
        }
        return tokens;
    }

    parse = (s: string) => {
        const tokens = this.tokenize(this.sanitize(s));

        for (const token of tokens) {

        }
    }
}
