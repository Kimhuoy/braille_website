// Copies the icons the website uses into src/data/icons.json, so pages never fetch icons
// from api.iconify.design at run time (a third-party server the site would depend on).
// Run after adding or renaming an icon:  npm run icons   (also runs before every build)
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getIcons } from "@iconify/utils";

const SRC = new URL("../src/", import.meta.url).pathname;
const OUT = join(SRC, "data", "icons.json");

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(jsx?|tsx?)$/.test(name) ? [path] : [];
  });
}

const wanted = new Map(); // prefix -> Set(names)
for (const file of files(SRC)) {
  for (const [, prefix, name] of readFileSync(file, "utf8").matchAll(/["'`]([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)["'`]/g)) {
    if (!wanted.has(prefix)) wanted.set(prefix, new Set());
    wanted.get(prefix).add(name);
  }
}

const collections = [];
const missing = [];
for (const [prefix, names] of wanted) {
  let set;
  try {
    set = JSON.parse(readFileSync(new URL(`../node_modules/@iconify-json/${prefix}/icons.json`, import.meta.url)));
  } catch {
    continue; // not an icon set (e.g. a Tailwind class such as md:col-span-3)
  }
  const subset = getIcons(set, [...names]);
  const found = new Set(Object.keys(subset?.icons ?? {}).concat(Object.keys(subset?.aliases ?? {})));
  names.forEach((n) => found.has(n) || missing.push(`${prefix}:${n}`));
  if (subset) collections.push(subset);
}

if (missing.length) {
  console.error("Icons not found in @iconify-json packages:", missing.join(", "));
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify(collections));
console.log(`icons.json: ${collections.reduce((n, c) => n + Object.keys(c.icons).length, 0)} icons from ${collections.length} sets`);
