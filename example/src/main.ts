import {Canvas, SMILESParser} from "grignard";

const canvasEl = document.getElementById("main-canvas");
const input = document.getElementById("smiles-input");

if (canvasEl == null || !(canvasEl instanceof HTMLCanvasElement)) throw new Error("invalid canvas");
if (input == null || !(input instanceof HTMLInputElement)) throw new Error("invalid input");

const canvas = new Canvas(canvasEl);
const parser = new SMILESParser();

input.addEventListener("input", () => {
    canvas.draw(parser.parse(input.value));
});
