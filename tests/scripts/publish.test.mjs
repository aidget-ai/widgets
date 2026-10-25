import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publish,registryVersion } from '../../scripts/publish.mjs';
import { integrity } from '../../scripts/package.mjs';
function fixture(t) {const root=mkdtempSync(join(tmpdir(),'aidget-publish-'));t.after(()=>rmSync(root,{recursive:true,force:true}));mkdirSync(join(root,'tgz'));const bytes=Buffer.from('tarball');writeFileSync(join(root,'tgz/widget.tgz'),bytes);const sri=integrity(bytes);writeFileSync(join(root,'index.json'),JSON.stringify({packages:{'@aidget-community/widget':{latest:'1.0.0',versions:{'1.0.0':{file:'tgz/widget.tgz',integrity:sri}}}}}));return {root,sri};}
test('first publication without credentials remains available from dist',async t=>{const {root}=fixture(t);let ran=false;const summary=await publish(root,{lookup:async()=>null,run:()=>{ran=true;},env:{}});assert.equal(ran,false);assert.match(summary[0],/available from dist/);});
test('an identical npm version is skipped',async t=>{const {root,sri}=fixture(t);let ran=false;await publish(root,{lookup:async()=>({dist:{integrity:sri}}),run:()=>{ran=true;},env:{}});assert.equal(ran,false);});
test('a conflicting existing npm version is an error',async t=>{const {root}=fixture(t);await assert.rejects(publish(root,{lookup:async()=>({dist:{integrity:'different'}}),env:{}}),/differs/);});
test('publication uses the packed artifact and suppresses lifecycle scripts',async t=>{const {root}=fixture(t);let args;await publish(root,{lookup:async(_name,version)=>version?null:{name:'exists'},run:(_command,value)=>{args=value;},env:{}});assert.ok(args.includes('--ignore-scripts'));assert.equal(args[1],join(root,'tgz/widget.tgz'));});
test('existing-package publish errors fail the task',async t=>{const {root}=fixture(t);await assert.rejects(publish(root,{lookup:async(_name,version)=>version?null:{},run:()=>{throw new Error('OIDC denied');},env:{}}),/OIDC denied/);});
test('registry transport errors are not mistaken for unpublished packages',async()=>{await assert.rejects(registryVersion('x','1.0.0',async()=>({status:503,ok:false})),/503/);assert.equal(await registryVersion('x','1.0.0',async()=>({status:404,ok:false})),null);});
