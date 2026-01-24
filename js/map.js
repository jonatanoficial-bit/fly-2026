// js/map.js — Mapa 2D offline (Canvas) com aviões andando e rotas desenhadas
(function(){
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  let canvas, ctx, bgImg;
  let w=0, h=0;
  let selected = { type:null, id:null };

  // projeção simples (equiretangular)
  function lonToX(lon){ return (lon + 180) / 360 * w; }
  function latToY(lat){ return (90 - lat) / 180 * h; }

  function resize(){
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    w = Math.floor(rect.width * DPR);
    h = Math.floor(rect.height * DPR);
    canvas.width = w;
    canvas.height = h;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);
  }

  function draw(){
    if(!ctx) return;
    const state = window.flightData;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    // fundo
    ctx.clearRect(0,0,cw,ch);
    if(bgImg && bgImg.complete){
      ctx.drawImage(bgImg, 0, 0, cw, ch);
    } else {
      ctx.fillStyle = "#0b1420";
      ctx.fillRect(0,0,cw,ch);
    }

    // rotas
    const routes = (state.routes||[]).filter(r=>r.active);
    ctx.lineWidth = 2;
    for(const r of routes){
      const o = (state.airports||[]).find(a=>a.code===r.origin);
      const d = (state.airports||[]).find(a=>a.code===r.destination);
      if(!o||!d) continue;

      const ox = lonToX(o.lon) / DPR;
      const oy = latToY(o.lat) / DPR;
      const dx = lonToX(d.lon) / DPR;
      const dy = latToY(d.lat) / DPR;

      const isSel = selected.type==="route" && selected.id===r.routeId;
      ctx.strokeStyle = isSel ? "rgba(57,183,255,.95)" : "rgba(234,241,255,.25)";
      ctx.setLineDash(isSel ? [6,4] : [10,10]);
      ctx.beginPath();
      ctx.moveTo(ox,oy);
      ctx.lineTo(dx,dy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // aeroportos
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    for(const a of (state.airports||[])){
      const x = lonToX(a.lon)/DPR;
      const y = latToY(a.lat)/DPR;
      ctx.fillStyle = "rgba(234,241,255,.85)";
      ctx.beginPath();
      ctx.arc(x,y,3,0,Math.PI*2);
      ctx.fill();

      // etiqueta apenas para hubs principais (ou selecionado)
      if(["GRU","GIG","BSB","LHR","CDG","JFK","LAX","DXB","HND","SIN"].includes(a.code) || (selected.type==="airport" && selected.id===a.code)){
        ctx.fillStyle = "rgba(234,241,255,.70)";
        ctx.fillText(a.code, x+6, y-6);
      }
    }

    // aviões
    const flights = (state.flights||[]).filter(f=>f.status==="EM_ROTA");
    for(const f of flights){
      const ox = lonToX(f.origin.lon)/DPR;
      const oy = latToY(f.origin.lat)/DPR;
      const dx = lonToX(f.destination.lon)/DPR;
      const dy = latToY(f.destination.lat)/DPR;

      const x = ox + (dx-ox)*(f.progress01||0);
      const y = oy + (dy-oy)*(f.progress01||0);

      const isSel = selected.type==="flight" && selected.id===f.id;

      // halo
      ctx.fillStyle = isSel ? "rgba(57,183,255,.25)" : "rgba(255,255,255,.12)";
      ctx.beginPath();
      ctx.arc(x,y,10,0,Math.PI*2);
      ctx.fill();

      // corpo
      ctx.fillStyle = isSel ? "rgba(57,183,255,.95)" : "rgba(234,241,255,.90)";
      ctx.beginPath();
      ctx.arc(x,y,4,0,Math.PI*2);
      ctx.fill();

      // label curto
      ctx.fillStyle = "rgba(234,241,255,.70)";
      ctx.fillText(f.flightNumber, x+8, y+4);
    }
  }

  function hitTest(px, py){
    // px/py em CSS pixels
    const state = window.flightData;
    const flights = (state.flights||[]).filter(f=>f.status==="EM_ROTA");
    // flights first
    for(const f of flights){
      const ox = lonToX(f.origin.lon)/DPR;
      const oy = latToY(f.origin.lat)/DPR;
      const dx = lonToX(f.destination.lon)/DPR;
      const dy = latToY(f.destination.lat)/DPR;
      const x = ox + (dx-ox)*(f.progress01||0);
      const y = oy + (dy-oy)*(f.progress01||0);
      const dist = Math.hypot(px-x, py-y);
      if(dist < 14){
        return {type:"flight", id:f.id};
      }
    }
    // routes
    const routes = (state.routes||[]).filter(r=>r.active);
    for(const r of routes){
      const o = (state.airports||[]).find(a=>a.code===r.origin);
      const d = (state.airports||[]).find(a=>a.code===r.destination);
      if(!o||!d) continue;
      const x1 = lonToX(o.lon)/DPR, y1=latToY(o.lat)/DPR;
      const x2 = lonToX(d.lon)/DPR, y2=latToY(d.lat)/DPR;
      // distance from point to segment
      const dxs=x2-x1, dys=y2-y1;
      const len2=dxs*dxs+dys*dys;
      let t = len2? ((px-x1)*dxs+(py-y1)*dys)/len2 : 0;
      t = Math.max(0,Math.min(1,t));
      const cx = x1 + t*dxs;
      const cy = y1 + t*dys;
      const dist = Math.hypot(px-cx, py-cy);
      if(dist < 10){
        return {type:"route", id:r.routeId};
      }
    }
    // airports
    for(const a of (state.airports||[])){
      const x = lonToX(a.lon)/DPR, y = latToY(a.lat)/DPR;
      if(Math.hypot(px-x, py-y) < 10){
        return {type:"airport", id:a.code};
      }
    }
    return {type:null, id:null};
  }

  function setSelected(sel){
    selected = sel || {type:null,id:null};
    window.dispatchEvent(new CustomEvent("map-selection", {detail: selected}));
  }

  function onPointer(e){
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    const hit = hitTest(x,y);
    setSelected(hit);
  }

  function init(){
    canvas = document.getElementById("mapCanvas");
    const loading = document.getElementById("mapLoading");
    if(!canvas) return;

    ctx = canvas.getContext("2d", {alpha:true});
    bgImg = new Image();
    bgImg.src = "assets/images/map_bg.png";
    bgImg.onload = () => { if(loading) loading.classList.add("hidden"); draw(); };

    resize();
    window.addEventListener("resize", () => { resize(); draw(); });

    canvas.addEventListener("click", onPointer, {passive:true});
    canvas.addEventListener("touchstart", (e)=>{ 
      const t = e.touches && e.touches[0]; if(!t) return;
      onPointer({clientX:t.clientX, clientY:t.clientY});
    }, {passive:true});

    // render loop
    function loop(){
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  window.MapModule = { init, setSelected };
})();
