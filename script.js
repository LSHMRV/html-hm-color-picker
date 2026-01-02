
/* HanseMerkur Farbtool – reines Frontend, kein Build nötig.
   Features: Palette, Tints/Shades, Harmonien, WCAG, Export/Import, CSS Vars, Split-Panel.
*/

// ==== Palette (aus Anfrage) ====
const BASE_PALETTE = [
  { group: "Black & White", name: "HanseMerkur Schwarz 1", hex: "#363636" },
  { group: "Black & White", name: "HanseMerkur Schwarz 2", hex: "#868686" },
  { group: "Black & White", name: "HanseMerkur Schwarz 3", hex: "#C3C3C3" },
  { group: "Black & White", name: "HanseMerkur Fond 3",   hex: "#ECECED" },
  { group: "Black & White", name: "White",                hex: "#FFFFFF" },

  { group: "Primary Colors", name: "HanseMerkur Grün 1", hex: "#00A075" },
  { group: "Primary Colors", name: "HanseMerkur Grün 2", hex: "#7DBF68" },
  { group: "Primary Colors", name: "HanseMerkur Grün 3", hex: "#005E52" },

  { group: "Secondary Colors", name: "HanseMerkur A1", hex: "#E4D6C0" },
  { group: "Secondary Colors", name: "HanseMerkur A2", hex: "#641937" },
  { group: "Secondary Colors", name: "HanseMerkur A3", hex: "#C68C2D" },
  { group: "Secondary Colors", name: "HanseMerkur B1", hex: "#EBCD23" },
  { group: "Secondary Colors", name: "HanseMerkur B2", hex: "#AAD0DC" },
  { group: "Secondary Colors", name: "HanseMerkur B3", hex: "#918A87" },
  { group: "Secondary Colors", name: "HanseMerkur C1", hex: "#324187" },
  { group: "Secondary Colors", name: "HanseMerkur C2", hex: "#825FAA" },
  { group: "Secondary Colors", name: "HanseMerkur C3", hex: "#CD6937" },

  { group: "Fond Colors", name: "HanseMerkur Fond 1", hex: "#EDF6F2" },
  { group: "Fond Colors", name: "HanseMerkur Fond 2", hex: "#FBF6F1" },
  { group: "Fond Colors", name: "HanseMerkur Fond 3", hex: "#ECECED" },
  { group: "Fond Colors", name: "HanseMerkur Fond A2", hex: "#F2EBF0" },
  { group: "Fond Colors", name: "HanseMerkur Fond A3 (Replika)", hex: "#FAF4EA" },
  { group: "Fond Colors", name: "HanseMerkur Fond B1", hex: "#FFF7E6" },
  { group: "Fond Colors", name: "HanseMerkur Fond C1", hex: "#EBF0FA" },

  { group: "Auxiliary Colors", name: "Fehlerfarbe", hex: "#FF0000" },
  { group: "Auxiliary Colors", name: "Fehlerfarbe Fond", hex: "#FFC7C8" },
];

// ==== State ====
let palette = loadPalette();
let current = { name: "—", hex: "#00A075" }; // default to Grün 1

// ==== Helpers: Color conversions ====
function clamp01(x){ return Math.min(1, Math.max(0, x)); }
function mod360(h){ return ((h % 360) + 360) % 360; }

function hexToRgb(hex){
  const h = hex.replace('#','').trim();
  const clean = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const int = parseInt(clean, 16);
  return { r: (int>>16)&255, g: (int>>8)&255, b: int&255 };
}
function rgbToHex(r,g,b){
  const s = (n)=> n.toString(16).padStart(2,'0').toUpperCase();
  return `#${s(r)}${s(g)}${s(b)}`;
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h, s, l=(max+min)/2;
  const d = max-min;
  if(d===0){ h=0; s=0; }
  else{
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d + (g<b?6:0); break;
      case g: h=(b-r)/d + 2; break;
      case b: h=(r-g)/d + 4; break;
    }
    h*=60;
  }
  return { h, s, l };
}
function hslToRgb(h,s,l){
  h = mod360(h)/360;
  function hue2rgb(p,q,t){
    t = (t<0?t+1:(t>1?t-1:t));
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3 - t)*6;
    return p;
  }
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const q = l<0.5 ? l*(1+s) : l+s - l*s;
    const p = 2*l - q;
    r = hue2rgb(p,q,h+1/3);
    g = hue2rgb(p,q,h);
    b = hue2rgb(p,q,h-1/3);
  }
  return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
}
function hexToHsl(hex){
  const {r,g,b} = hexToRgb(hex);
  const hsl = rgbToHsl(r,g,b);
  return { h: Math.round(hsl.h), s: Math.round(hsl.s*100), l: Math.round(hsl.l*100) };
}
function hslToHex(h,s,l){
  const rgb = hslToRgb(h, s/100, l/100);
  return rgbToHex(rgb.r,rgb.g,rgb.b);
}

// ==== Harmonies ====
function analogous(hex, angle=30){
  const {h,s,l} = hexToHsl(hex);
  return [
    { name: `Analog -${angle}°`, hex: hslToHex(h-angle, s, l) },
    { name: `Basis`, hex },
    { name: `Analog +${angle}°`, hex: hslToHex(h+angle, s, l) },
  ];
}
function complementary(hex){
  const {h,s,l} = hexToHsl(hex);
  return [
    { name: `Basis`, hex },
    { name: `Komplementär`, hex: hslToHex(h+180, s, l) },
  ];
}
function splitComplementary(hex, delta=30){
  const {h,s,l} = hexToHsl(hex);
  // um Komplement herum ±delta
  return [
    { name: `Split -${delta}°`, hex: hslToHex(h+180-delta, s, l) },
    { name: `Basis`, hex },
    { name: `Split +${delta}°`, hex: hslToHex(h+180+delta, s, l) },
  ];
}
function triadic(hex){
  const {h,s,l} = hexToHsl(hex);
  return [
    { name: `Triad -120°`, hex: hslToHex(h-120, s, l) },
    { name: `Basis`, hex },
    { name: `Triad +120°`, hex: hslToHex(h+120, s, l) },
  ];
}
function tetradic(hex){
  const {h,s,l} = hexToHsl(hex);
  return [
    { name: `Basis`, hex },
    { name: `+90°`, hex: hslToHex(h+90, s, l) },
    { name: `Komplementär`, hex: hslToHex(h+180, s, l) },
    { name: `+270°`, hex: hslToHex(h+270, s, l) },
  ];
}

// ==== Tints/Shades ====
function tintsAndShades(hex, steps=8){
  // 50% Tints (heller) + 50% Shades (dunkler) um Basis herum
  const {h,s,l} = hexToHsl(hex);
  const out = [];
  const half = Math.floor(steps/2);
  const step = Math.max(1, Math.round( (100 - l) / (half+1) ));
  const stepDown = Math.max(1, Math.round( l / (half+1) ));

  // dunkler
  for(let i=half; i>=1; i--){
    const nl = Math.max(0, l - i*stepDown);
    out.push({ kind:"shade", l:nl, hex: hslToHex(h,s,nl) });
  }
  // basis
  out.push({ kind:"base", l, hex });
  // heller
  for(let i=1; i<=half; i++){
    const nl = Math.min(100, l + i*step);
    out.push({ kind:"tint", l:nl, hex: hslToHex(h,s,nl) });
  }
  return out;
}

// ==== WCAG Contrast ====
function relativeLuminance(hex){
  const {r,g,b} = hexToRgb(hex);
  const transform = (c)=> {
    c/=255;
    return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  };
  const R=transform(r), G=transform(g), B=transform(b);
  return 0.2126*R + 0.7152*G + 0.0722*B;
}
function contrastRatio(hex1, hex2){
  const L1 = relativeLuminance(hex1), L2 = relativeLuminance(hex2);
  const [hi, lo] = L1>=L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function wcagRating(ratio, isLarge=false){
  // AA normal: >=4.5, AAA normal: >=7.0; AA large: >=3.0, AAA large: >=4.5
  const AA = isLarge ? 3.0 : 4.5;
  const AAA = isLarge ? 4.5 : 7.0;
  if(ratio >= AAA) return "AAA";
  if(ratio >= AA)  return "AA";
  return "Nicht ausreichend";
}
function recommendTextColor(bgHex){
  const cWhite = contrastRatio(bgHex, "#FFFFFF");
  const cBlack = contrastRatio(bgHex, "#000000");
  if(cWhite === cBlack) return "Weiß/Schwarz gleich – prüfe Kontext";
  return cWhite >= cBlack ? "Weiße Schrift empfohlen" : "Schwarze Schrift empfohlen";
}

// ==== Local Storage ====
function loadPalette(){
  const raw = localStorage.getItem("hm-palette");
  if(!raw) return BASE_PALETTE.slice();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : BASE_PALETTE.slice();
  } catch(e){
    return BASE_PALETTE.slice();
  }
}
function savePalette(){
  localStorage.setItem("hm-palette", JSON.stringify(palette));
}

// ==== UI Rendering ====
function renderPalette(filter=""){
  const wrap = document.getElementById("paletteContainer");
  wrap.innerHTML = "";
  // Gruppen bilden
  const groups = {};
  palette.forEach(c=>{
    const g = c.group || "Sonstige";
    if(!groups[g]) groups[g] = [];
    groups[g].push(c);
  });

  Object.keys(groups).forEach(g=>{
    const groupEl = document.createElement("div");
    groupEl.className = "palette-group";
    const h2 = document.createElement("h2");
    h2.textContent = g;
    groupEl.appendChild(h2);

    groups[g]
      .filter(c=>{
        if(!filter) return true;
        const f = filter.toLowerCase();
        return c.name.toLowerCase().includes(f) || c.hex.toLowerCase().includes(f);
      })
      .forEach(c=>{
        const item = document.createElement("div");
        item.className = "color-item";
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.style.background = c.hex;

        const meta = document.createElement("div");
        meta.className = "meta";
        const nm = document.createElement("div");
        nm.textContent = c.name;
        const hx = document.createElement("div");
        hx.innerHTML = `<code>${c.hex}</code>`;

        meta.appendChild(nm); meta.appendChild(hx);

        const btns = document.createElement("div");
        const pick = document.createElement("button");
        pick.textContent = "Auswählen";
        pick.addEventListener("click", () => setCurrent(c.name, c.hex));
        const copy = document.createElement("button");
        copy.textContent = "HEX kopieren";
        copy.addEventListener("click", () => copyToClipboard(c.hex));

        btns.appendChild(pick); btns.appendChild(copy);

        item.appendChild(chip); item.appendChild(meta); item.appendChild(btns);
        groupEl.appendChild(item);
      });

    wrap.appendChild(groupEl);
  });
}
function setCurrent(name, hex){
  current = { name, hex: normalizeHex(hex) };
  document.getElementById("currentName").textContent = name;
  document.getElementById("currentHex").textContent = current.hex;
  const {h,s,l} = hexToHsl(current.hex);
  document.getElementById("currentHsl").textContent = `HSL(${h}°, ${s}%, ${l}%)`;
  document.getElementById("currentSwatch").style.background = current.hex;

  renderTints();
  renderHarmonies();
  renderContrast();
}
function renderTints(){
  const steps = parseInt(document.getElementById("tintSteps").value, 10);
  document.getElementById("tintStepsVal").textContent = steps;
  const list = tintsAndShades(current.hex, steps);
  const grid = document.getElementById("tintsGrid");
  grid.innerHTML = "";
  list.forEach(entry=>{
    const card = document.createElement("div");
    card.className = "swatch-card";
    const big = document.createElement("div");
    big.className = "big";
    big.style.background = entry.hex;

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<div><strong>${entry.kind.toUpperCase()}</strong> · L=${entry.l}%</div><div><code>${entry.hex}</code></div>`;

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const copy = document.createElement("button");
    copy.textContent = "HEX";
    copy.addEventListener("click", ()=>copyToClipboard(entry.hex));
    const use = document.createElement("button");
    use.textContent = "Als Basis";
    use.addEventListener("click", ()=> setCurrent(`${current.name} (${entry.kind})`, entry.hex));

    btnRow.appendChild(copy); btnRow.appendChild(use);

    card.appendChild(big); card.appendChild(info); card.appendChild(btnRow);
    grid.appendChild(card);
  });
}
function renderHarmonies(){
  const angle = parseInt(document.getElementById("analogAngle").value, 10);
  document.getElementById("analogAngleVal").textContent = `${angle}°`;

  renderHarmonyRow("analogousRow", analogous(current.hex, angle));
  renderHarmonyRow("complementaryRow", complementary(current.hex));
  renderHarmonyRow("splitCompRow", splitComplementary(current.hex, angle));
  renderHarmonyRow("triadicRow", triadic(current.hex));
  renderHarmonyRow("tetradicRow", tetradic(current.hex));
}
function renderHarmonyRow(targetId, list){
  const row = document.getElementById(targetId);
  row.innerHTML = "";
  list.forEach(col=>{
    const card = document.createElement("div");
    card.className = "swatch-card";
    const big = document.createElement("div");
    big.className = "big";
    big.style.background = col.hex;

    const info = document.createElement("div");
    info.className = "info";
    const hsl = hexToHsl(col.hex);
    info.innerHTML = `<div><strong>${col.name}</strong></div><div><code>${col.hex}</code> · HSL(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)</div>`;

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const copy = document.createElement("button");
    copy.textContent = "HEX";
    copy.addEventListener("click", ()=>copyToClipboard(col.hex));
    const use = document.createElement("button");
    use.textContent = "Als Basis";
    use.addEventListener("click", ()=> setCurrent(`${col.name}`, col.hex));

    btnRow.appendChild(copy); btnRow.appendChild(use);

    card.appendChild(big); card.appendChild(info); card.appendChild(btnRow);
    row.appendChild(card);
  });
}
function renderContrast(){
  const cW = contrastRatio(current.hex, "#FFFFFF");
  const cB = contrastRatio(current.hex, "#000000");
  const ratingW = wcagRating(cW);
  const ratingWL = wcagRating(cW, true);
  const ratingB = wcagRating(cB);
  const ratingBL = wcagRating(cB, true);

  const row = document.getElementById("contrastRow");
  row.innerHTML = "";

  function cardFor(bg, label, ratio, rN, rL){
    const card = document.createElement("div");
    card.className = "contrast-card";
    const preview = document.createElement("div");
    preview.className = "preview";
    const p1 = document.createElement("div"); p1.style.background = bg; p1.style.color = "#FFFFFF"; p1.textContent="Weiße Schrift";
    const p2 = document.createElement("div"); p2.style.background = bg; p2.style.color = "#000000"; p2.textContent="Schwarze Schrift";
    preview.appendChild(p1); preview.appendChild(p2);

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      <div><strong>${label}</strong></div>
      <div>Kontrast zu Weiß: ${ratio === cW ? cW.toFixed(2) : cW.toFixed(2)} (${ratingW} normal / ${ratingWL} groß)</div>
      <div>Kontrast zu Schwarz: ${cB.toFixed(2)} (${ratingB} normal / ${ratingBL} groß)</div>
    `;
    card.appendChild(preview); card.appendChild(info);
    return card;
  }

  row.appendChild(cardFor(current.hex, `Aktuelle Farbe ${current.hex}`, cW, ratingW, ratingWL));

  document.getElementById("textRecommendation").textContent = recommendTextColor(current.hex);
}

// ==== CSS Vars export ====
function generateCssVars(pal){
  const lines = pal.map(c=>{
    const slug = c.name
      .toLowerCase()
      .replace(/\s+/g,'-')
      .replace(/[()]/g,'')
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .replace(/[^a-z0-9-]/g,'');
    return `  --${slug}: ${c.hex}; /* ${c.group} */`;
  });
  return `:root {\n${lines.join("\n")}\n}\n`;
}

// ==== copy ====
function copyToClipboard(text){
  navigator.clipboard?.writeText(text).then(()=> {
    // small toast alternative
    console.log("Copied:", text);
  }).catch(()=>{});
}

// ==== Normalize Hex ====
function normalizeHex(h){
  const m = h.trim().toUpperCase();
  if(!m.startsWith("#")) return `#${m}`;
  return m;
}

// ==== Tabs ====
function setupTabs(){
  const btns = document.querySelectorAll(".tab-btn");
  btns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      btns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-content").forEach(c=>{
        c.classList.remove("active");
      });
      document.getElementById(`tab-${tab}`).classList.add("active");
    });
  });
}

// ==== Split panel drag ====
function setupDivider(){
  const divider = document.getElementById("divider");
  const left = document.getElementById("leftPanel");
  const right = document.getElementById("rightPanel");

  let dragging = false;
  divider.addEventListener("mousedown", ()=> dragging = true);
  window.addEventListener("mouseup", ()=> dragging = false);
  window.addEventListener("mousemove", (e)=>{
    if(!dragging) return;
    const min = 240; const max = window.innerWidth - 280;
    const x = Math.min(max, Math.max(min, e.clientX));
    left.style.width = `${x}px`;
    right.style.width = `calc(100% - ${x}px - 8px)`;
  });
}

// ==== Search ====
function setupSearch(){
  const input = document.getElementById("searchInput");
  input.addEventListener("input", ()=>{
    renderPalette(input.value);
  });
}

// ==== Import/Export/Reset ====
function setupImportExport(){
  const importFile = document.getElementById("importFile");
  importFile.addEventListener("change", (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(Array.isArray(data)){
          palette = data.map(c=> ({ group:c.group||"Custom", name:c.name||"Unbenannt", hex: normalizeHex(c.hex||"#000000") }));
          savePalette();
          renderPalette();
          // set first as current
          if(palette[0]) setCurrent(palette[0].name, palette[0].hex);
        } else {
          alert("JSON muss ein Array von Objekten mit {group, name, hex} sein.");
        }
      } catch(err){
        alert("Ungültige JSON-Datei.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("exportBtn").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(palette, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hm-palette.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("resetBtn").addEventListener("click", ()=>{
    if(confirm("Lokale Palette zurücksetzen und Standardpalette laden?")){
      localStorage.removeItem("hm-palette");
      palette = BASE_PALETTE.slice();
      renderPalette();
    }
  });
}

// ==== Free color picker ====
function setupFreePicker(){
  const picker = document.getElementById("freePicker");
  const hexInput = document.getElementById("freeHex");
  picker.addEventListener("input", ()=>{
    hexInput.value = picker.value.toUpperCase();
  });
  document.getElementById("useFreeColor").addEventListener("click", ()=>{
    const h = hexInput.value || picker.value;
    if(!/^#?[0-9A-Fa-f]{6}$/.test(h.trim())){
      alert("Bitte gültigen HEX-Wert eingeben (z.B. #00A075).");
      return;
    }
    setCurrent("Freie Farbe", normalizeHex(h));
  });
}

// ==== CSS Vars UI ====
function renderCssVars(){
  const css = generateCssVars(palette);
  document.getElementById("cssVarsArea").value = css;
}
function setupCssVarsCopy(){
  document.getElementById("copyCssVars").addEventListener("click", ()=>{
    const text = document.getElementById("cssVarsArea").value;
    copyToClipboard(text);
  });
}

// ==== Init ====
window.addEventListener("DOMContentLoaded", ()=>{
  setupTabs();
  setupDivider();
  setupSearch();
  setupImportExport();
  setupFreePicker();
  setupCssVarsCopy();

  renderPalette();
  renderCssVars();

  // set default current to Grün 1
  const defaultColor = palette.find(c => c.name.includes("Grün 1")) || palette[0];
  if(defaultColor){
    setCurrent(defaultColor.name, defaultColor.hex);
  } else {
    setCurrent("Freie Farbe", "#00A075");
  }

  // Listeners for controls
  document.getElementById("tintSteps").addEventListener("input", renderTints);
  document.getElementById("analogAngle").addEventListener("input", renderHarmonies);
  document.getElementById("copyHex").addEventListener("click", ()=> copyToClipboard(current.hex));
});
``
