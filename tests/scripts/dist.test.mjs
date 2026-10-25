import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mergeDist } from '../../scripts/dist.mjs';
import { integrity } from '../../scripts/package.mjs';
function fixture(t) {
  const base = mkdtempSync(join(tmpdir(),'aidget-dist-')); t.after(()=>rmSync(base,{recursive:true,force:true}));
  const packed = join(base,'packed'), dist = join(base,'dist'); mkdirSync(join(packed,'tgz'),{recursive:true});
  const bytes = Buffer.from('packed-v1'); writeFileSync(join(packed,'tgz/widget.tgz'),bytes);
  const index = {packages:{'@aidget-community/widget':{latest:'1.0.0',versions:{'1.0.0':{file:'tgz/widget.tgz',integrity:integrity(bytes),sourceCommit:'a'.repeat(40),files:[]}}}}};
  writeFileSync(join(packed,'index.json'),JSON.stringify(index)); return {packed,dist,index};
}
test('re-running dist preserves bytes and original version metadata',t=>{
 const {packed,dist,index}=fixture(t); mergeDist(packed,dist); const before=readFileSync(join(dist,'index.json'),'utf8'); index.packages['@aidget-community/widget'].versions['1.0.0'].sourceCommit='b'.repeat(40); writeFileSync(join(packed,'index.json'),JSON.stringify(index)); mergeDist(packed,dist); assert.equal(readFileSync(join(dist,'index.json'),'utf8'),before);
});
test('published versions cannot be replaced',t=>{
 const {packed,dist,index}=fixture(t); mergeDist(packed,dist); const bytes=Buffer.from('replacement');writeFileSync(join(packed,'tgz/widget.tgz'),bytes);index.packages['@aidget-community/widget'].versions['1.0.0'].integrity=integrity(bytes);writeFileSync(join(packed,'index.json'),JSON.stringify(index));assert.throws(()=>mergeDist(packed,dist),/immutable/);
});
test('delisted packages stay in dist',t=>{const {packed,dist}=fixture(t);mergeDist(packed,dist);writeFileSync(join(packed,'index.json'),JSON.stringify({packages:{}}));mergeDist(packed,dist);assert.ok(JSON.parse(readFileSync(join(dist,'index.json'))).packages['@aidget-community/widget']);});
