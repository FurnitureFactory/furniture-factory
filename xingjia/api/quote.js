/** Server-side desk pricing (must match customise.html catalogue). Amounts in SGD. */
const MOTOR = { "Single Motor": 399, "Dual Motor": 549 };
const FRAME = { Black: 0, White: 30 };
const MATERIAL = { Plywood: 0, "Real Wood": 120 };
const COLOUR = { Oak: 0, "Light Brown": 30, Walnut: 60, Olive: 40 };
const LENGTH = { "120cm": 0, "140cm": 40, "160cm": 80 };
const BREADTH = { "50cm": 0, "60cm": 30 };
const EDGE = { Flat: 0, "Curve etched": 60 };
const THICKNESS = { "18mm": 0, "25mm": 0, "36mm": 55 };

function pick(map, key, label) {
  if (!(key in map)) throw new Error(`Invalid ${label}: ${key}`);
  return map[key];
}

function quote(sel) {
  if (!sel || typeof sel !== "object") throw new Error("Missing configuration");

  const motor = pick(MOTOR, sel.motor, "motor");
  const frame = pick(FRAME, sel.frameColour, "frame colour");
  const material = pick(MATERIAL, sel.material, "material");
  const colour = pick(COLOUR, sel.topColour, "top colour");
  const length = pick(LENGTH, sel.length, "length");
  const breadth = pick(BREADTH, sel.breadth, "breadth");
  const edge = pick(EDGE, sel.edge, "edge");
  const thickness = pick(THICKNESS, sel.thickness, "thickness");

  const lines = [
    { name: `${sel.motor} frame`, amount: motor },
    { name: `${sel.frameColour} frame finish`, amount: frame },
    { name: `${sel.material} top`, amount: material },
    { name: `${sel.topColour} colour`, amount: colour },
    { name: `${sel.length} × ${sel.breadth}`, amount: length + breadth },
    { name: `${sel.edge} edge`, amount: edge },
    { name: `${sel.thickness} top`, amount: thickness },
  ].filter((l) => l.amount > 0);

  const base = motor;
  const addons = frame + material + colour + length + breadth + edge + thickness;
  const total = base + addons;

  if (lines.length === 0) lines.push({ name: `${sel.motor} standing desk`, amount: total });

  const description = `${sel.motor} · ${sel.topColour} ${sel.material} · ${sel.length}×${sel.breadth} · ${sel.edge} edge`;

  return { total, description, lines, sel };
}

module.exports = { quote };
