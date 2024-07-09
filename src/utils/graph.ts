export class Node<T> {
    data: T;
    private _connectedEdges: Edge<T, any>[] = [];
    private _neighbors: Node<any>[] = [];

    constructor(data: T) {
        this.data = data;
    }

    connectTo = <V>(other: Node<V>): Edge<T, V> | null => {
        if (this._neighbors.includes(other)) return null;
        const edge = new Edge<T, V>(this, other);
        this._connectedEdges.push(edge);
        this._neighbors.push(other);
        other.connectTo(this);
        return edge;
    }

    delete = () => {
        for (let neighbor of this._neighbors) neighbor._propagateDeletion(this);
        this._neighbors = [];
        this._connectedEdges = [];
    }

    private _propagateDeletion = <V>(n: Node<V>) => {
        for (let i = 0; i < this._connectedEdges.length; i++) {
            if (this._connectedEdges[i].isLinkedTo(n)) {
                this._connectedEdges.splice(i, 1);
                break;
            }
        }
        const ni = this._neighbors.indexOf(n)
        if (ni >= 0) this._neighbors.splice(ni, 1);
    }
}

export class Edge<A, B> {
    nodeA: Node<A>;
    nodeB: Node<B>;

    constructor(nodeA: Node<A>, nodeB: Node<B>) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
    }

    isLinkedTo = (node: Node<A | B>) => this.nodeA === node || this.nodeB === node;

    reverse = () => new Edge<B, A>(this.nodeB, this.nodeA);
}