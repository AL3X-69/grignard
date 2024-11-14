// Organic subset atom valences
export const valences: {[index: string]: number[]} = {
    "H": [1],
    "B": [3],
    "C": [4],
    "N": [3, 5],
    "O": [2],
    "F": [1],
    "Na": [1],
    "Mg": [1],
    "P": [3, 5],
    "S": [2, 4, 6],
    "Cl": [1]
}

export const getHydrogenCount = (atom: string, bonds: number) => {
    const v = valences[atom];
    if (v === null) return null;
    for (let n of v) {
        if (bonds < n) return n;
    }
    return 0;
}