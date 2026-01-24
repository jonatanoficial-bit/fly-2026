// js/store.js
window.FlySimStore = {
  key: "flysim-save",
  save(d){
    try { localStorage.setItem(this.key, JSON.stringify(d)); return true; } catch(e){ return false; }
  },
  load(){
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch(e){
      return null;
    }
  },
  reset(){
    try { localStorage.removeItem(this.key); return true; } catch(e){ return false; }
  }
};
