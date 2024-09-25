import Canvas from "grignard/graphics/canvas";
import {SMILESParser} from "grignard/parsers/smiles";

const canvasEl = document.getElementById("main-canvas");
const input = document.getElementById("smiles-input");
const canvas = new Canvas(canvasEl);
const parser = new SMILESParser();

input.on("input", () => {
    canvas.draw(parser.parse(input.value));
})



