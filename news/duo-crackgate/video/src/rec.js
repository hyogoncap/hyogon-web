const {chromium}=require('playwright'); const {spawn}=require('child_process');
(async()=>{ const FPS=+process.argv[2]||60;
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1920,height:1920}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8790/render.html'+(process.argv[3]||'')); await p.evaluate(()=>window.ready);
  const dur=await p.evaluate(()=>window.DUR+0.4); const n=Math.ceil(dur*FPS);
  const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-i','music.wav',
    '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',(process.argv[4]||'duo-crackgate-motion.mp4')],{cwd:__dirname,stdio:['pipe','inherit','inherit']});
  for(let i=0;i<n;i++){
    const d=await p.evaluate(t=>{ draw(t); return document.getElementById('c').toDataURL('image/jpeg',0.93).split(',')[1]; },i/FPS);
    if(!ff.stdin.write(Buffer.from(d,'base64'))) await new Promise(r=>ff.stdin.once('drain',r));
    if(i%300===0) console.log('frame',i,'/',n);
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); console.log('errors',errs); await b.close(); })();
