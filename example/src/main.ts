import {SMILESParser, Canvas} from "../../src";

const canvasEl = document.getElementById("main-canvas");
const input = document.getElementById("smiles-input");
const refreshButton = document.getElementById("refresh");

if (canvasEl == null || !(canvasEl instanceof HTMLCanvasElement)) throw new Error("invalid canvas");
if (input == null || !(input instanceof HTMLInputElement)) throw new Error("invalid input");
if (refreshButton == null || !(refreshButton instanceof HTMLButtonElement)) throw new Error("invalid refreshButton");

const canvas = new Canvas(canvasEl);
const parser = new SMILESParser();

const refresh = () => {
    canvas.draw(parser.parse(input.value));
}

input.addEventListener("input", refresh);
refreshButton.addEventListener("click", refresh);
