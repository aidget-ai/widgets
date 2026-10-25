import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateResources} from '../../scripts/resources.mjs';
function fixture(t, html, css='') {
 const directory=mkdtempSync(join(tmpdir(),'aidget-resources-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));mkdirSync(join(directory,'assets'));
 const values={'index.html':html,'style.css':css,'assets/pic.png':'image','assets/more.css':'.nested{background:url(./pic.png)}'};
 for(const [file,value]of Object.entries(values))writeFileSync(join(directory,file),value);
 return {directory,files:Object.keys(values).map(path=>({path})),config:{id:'sample',permissions:[],network:[]}};
}
test('CSS imports and nested relative asset paths resolve against their own file',t=>{const f=fixture(t,'<link rel="stylesheet" href="./style.css">','@import "./assets/more.css";');validateResources(f.directory,f.config,f.files);});
test('srcset data URIs and local candidates remain valid',t=>{const f=fixture(t,'<img srcset="data:image/png;base64,AAAA 1x, ./assets/pic.png 2x">');validateResources(f.directory,f.config,f.files);});
test('only explicitly declared external resource origins pass',t=>{const f=fixture(t,'<img src="https://images.example.com/image.png">');assert.throws(()=>validateResources(f.directory,f.config,f.files),/undeclared network/);f.config.network=['https://images.example.com'];validateResources(f.directory,f.config,f.files);});
test('relative paths cannot escape the widget directory',t=>{const f=fixture(t,'<img src="../other/pic.png">');assert.throws(()=>validateResources(f.directory,f.config,f.files),/escapes widget/);});
test('a dummy URL used for resolution cannot be mistaken for a local resource',t=>{const f=fixture(t,'<img src="https://widget.invalid/content/sample/assets/pic.png">');assert.throws(()=>validateResources(f.directory,f.config,f.files),/undeclared network/);});
