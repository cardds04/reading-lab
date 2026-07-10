import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const dist = join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "client"), { recursive: true });
await mkdir(join(dist, "server"), { recursive: true });
await mkdir(join(dist, ".openai"), { recursive: true });
for (const file of ["index.html", "study.css", "study.js", "homework.js", "story.js", "game.js", "styles.css"]) {
  await cp(join(root, file), join(dist, "client", file));
}
await cp(join(root, "vendor"), join(dist, "client", "vendor"), { recursive: true });
try { await cp(join(root, "public"), join(dist, "client"), { recursive: true }); } catch {}
await cp(join(root, "worker.js"), join(dist, "server", "index.js"));
await writeFile(join(dist, ".openai", "hosting.json"), await (await import("node:fs/promises")).readFile(join(root, ".openai", "hosting.json")));
