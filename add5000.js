// add5000.js
const fs = require("fs");
const path = require("path");

const infile = path.resolve(__dirname, "watches.json");
const outfile = path.resolve(__dirname, "watches.updated.json"); // safe: writes to new file

try {
  const raw = fs.readFileSync(infile, "utf8");
  const arr = JSON.parse(raw);

  if (!Array.isArray(arr)) throw new Error("watches.json must be an array");

  const updated = arr.map(item => {
    const priceNum = Number(item.price) || 0;
    // add 5000, keep as string (same format you used)
    return { ...item, price: String(priceNum + 5000) };
  });

  fs.writeFileSync(outfile, JSON.stringify(updated, null, 2), "utf8");
  console.log("Done — wrote updated JSON to:", outfile);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
