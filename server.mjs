// Zero-dependency local preview server. Use `vercel dev` for serverless API testing.
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Local preview serves only the interface. Run `vercel dev` for API endpoints, then configure OPENAI_API_KEY on the server.'}));}
 const file=path.join(root,decodeURIComponent(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 try{const stat=await fs.stat(file);if(!stat.isFile())throw new Error();const buffer=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(buffer);}catch{res.writeHead(404);res.end('Not found')}
}).listen(port,()=>console.log(`SYSMART AI available at http://localhost:${port}`));
