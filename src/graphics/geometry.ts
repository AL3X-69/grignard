export interface Coordinates {
    x: number,
    y: number
}

export interface OrientedCoordinates extends Coordinates {
    angle: number,
}

export const getNextPoint = (point: OrientedCoordinates, distance: number): Coordinates => {
    return {
        x: point.x + distance * Math.cos(point.angle),
        y: point.y + distance * Math.sin(point.angle),
    }
}