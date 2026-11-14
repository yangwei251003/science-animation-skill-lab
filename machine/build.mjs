import {readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
const here=dirname(fileURLToPath(import.meta.url));
const staged=resolve(process.argv[2]??join(here,"../../evidence/mechanics/upstream/machine"));
const installed=resolve(process.argv[3]??staged);
const require=createRequire(join(staged,"package.json"));
const esbuild=require("esbuild");
const result=await esbuild.build({
  entryPoints:[join(here,"machine.js")],bundle:true,minify:true,format:"iife",write:false,
  alias:{"machine-kit":join(installed,"kit/lab-kit.js")},
  nodePaths:[join(staged,"node_modules")],legalComments:"none",target:"es2022"
});
const bundle=result.outputFiles[0].text.replace(/<\/script/g,"<\\/script");
const css=readFileSync(join(here,"style.css"),"utf8");
writeFileSync(join(here,"index.html"),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>一只气缸，两种力</title><style>'+css+'</style></head><body><script>'+bundle+'</script></body></html>');
writeFileSync(join(here,"AIRSUP-LICENSE.txt"),readFileSync(join(installed,"LICENSE")));
writeFileSync(join(here,"THREE-LICENSE.txt"),readFileSync(join(staged,"node_modules/three/LICENSE")));
