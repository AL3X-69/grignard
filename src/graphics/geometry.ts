export interface Coordinates {
    x: number,
    y: number
}

export interface OrientedCoordinates extends Coordinates {
    angle: number,
}

export const rad = (deg: number) => deg * Math.PI / 180;
export const deg = (rad: number) => rad * 180 / Math.PI;

export const getNextPoint = (point: OrientedCoordinates, distance: number): Coordinates => {
    return {
        x: point.x + distance * Math.cos(point.angle),
        y: point.y - distance * Math.sin(point.angle), // y axis is inverted (top>down)
    }
}

export const add = (c1: Coordinates, c2: Coordinates): Coordinates => ({
    x: c1.x + c2.x,
    y: c1.y + c2.y
});