// =====================================================
// ფუნქციის სახელოსნო — გაკვეთილის ლოგიკა
// კონფიდენციალურობა: არანაირი localStorage, ქუქი-ფაილი ან
// ქსელური მოთხოვნა. ყველა მდგომარეობა ინახება მხოლოდ ცვლადებში.
// =====================================================

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- პროგრესი (მხოლოდ მეხსიერებაში) ----------
const done = new Set();
function markDone(id) {
  done.add(id);
  $("#" + id).classList.add("done");
  $("#progress-text").textContent = `${done.size} / 4`;
  $("#progress-bar").style.width = `${done.size * 25}%`;
  $("#progress").setAttribute("aria-valuenow", done.size);
}

// ---------- ხელმისაწვდომობა ----------
let fs = 17;
const setFs = (v) => { fs = Math.min(23, Math.max(15, v)); document.documentElement.style.setProperty("--fs", fs + "px"); };
$("#btn-font-up").onclick = () => setFs(fs + 2);
$("#btn-font-down").onclick = () => setFs(fs - 2);
$("#btn-contrast").onclick = (e) => {
  const on = document.body.classList.toggle("hc");
  e.currentTarget.setAttribute("aria-pressed", String(on));
};

// =====================================================
// მოდული 1: ფუნქციის მანქანა
// =====================================================
const options = {
  fruit: [
    { v: "მარწყვი", e: "🍓", c: "#FB7185" },
    { v: "ბანანი", e: "🍌", c: "#FDE047" },
    { v: "მოცვი", e: "🫐", c: "#818CF8" },
  ],
  extra: [
    { v: "რძე", e: "🥛", c: "#F8FAFC" },
    { v: "იოგურტი", e: "🥣", c: "#FEF3C7" },
    { v: "წყალი", e: "💧", c: "#BAE6FD" },
  ],
};
const chosen = { fruit: options.fruit[0], extra: options.extra[0] };

$$(".chips").forEach((box) => {
  const g = box.dataset.group;
  box.setAttribute("aria-label", g === "fruit" ? "ხილის არჩევა" : "დანამატის არჩევა");
  options[g].forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.id = `chip-${g}-${i}`;
    b.textContent = `${o.e} ${o.v}`;
    b.setAttribute("aria-pressed", String(chosen[g] === o));
    b.onclick = () => {
      chosen[g] = o;
      $$(".chip", box).forEach((c) => c.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      renderM1Code();
    };
    box.appendChild(b);
  });
});

function renderM1Code() {
  $("#m1-code").innerHTML =
    `<span class="kw">def</span> <span class="fn">make_smoothie</span>(<span class="pa">fruit</span>, <span class="pa">extra</span>):\n` +
    `    drink = fruit + " და " + extra + "-ის სმუზი"\n` +
    `    <span class="ret">return</span> drink\n\n` +
    `<span class="fn">make_smoothie</span>(<span class="st">"${chosen.fruit.v}"</span>, <span class="st">"${chosen.extra.v}"</span>)`;
}
renderM1Code();

// ორი ფერის შერევა სითხის ფერისთვის
function mix(a, b) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v * 0.65 + y[i] * 0.35).toString(16).padStart(2, "0")).join("");
}

let busy = false;
$("#btn-call").onclick = async () => {
  if (busy) return;
  busy = true;
  const bl = $("#blender"), liq = $("#liquid"), stage = $("#stage"), drops = $("#drops");
  const t = reduceMotion ? 0.2 : 1;
  liq.setAttribute("height", 0); liq.setAttribute("y", 150);
  $("#m1-output").textContent = "…";

  stage.textContent = "① პარამეტრები შედის ფუნქციაში";
  [chosen.fruit, chosen.extra].forEach((o, i) => {
    const d = document.createElement("span");
    d.className = "drop"; d.textContent = o.e;
    d.style.left = `calc(50% + ${i ? 8 : -40}px)`;
    d.style.animationDelay = `${i * 0.25}s`;
    drops.appendChild(d);
  });
  await wait(1100 * t);
  drops.innerHTML = "";

  stage.textContent = "② ფუნქციის ტანი ამუშავებს მონაცემებს";
  bl.classList.add("spin");
  liq.setAttribute("fill", mix(chosen.fruit.c, chosen.extra.c));
  liq.setAttribute("height", 95); liq.setAttribute("y", 55);
  await wait(1400 * t);
  bl.classList.remove("spin");

  stage.textContent = "③ return აბრუნებს შედეგს";
  const r = $("#m1-result");
  r.classList.remove("pop"); void r.offsetWidth; r.classList.add("pop");
  $("#m1-output").textContent = `"${chosen.fruit.v} და ${chosen.extra.v}-ის სმუზი" 🥤`;
  busy = false;
  markDone("m1");
};

// =====================================================
// მოდული 2: ბლოკები → Python + კოდის ლუპა
// =====================================================
const tips = {
  def: ["def — „განსაზღვრე“", "ამ სიტყვით Python-ს ვეუბნებით: „ახლა ახალ ფუნქციას ვქმნი“. Scratch-ში ეს ვარდისფერი „განსაზღვრე“ ბლოკია."],
  name: ["ფუნქციის სახელი", "სახელით ვიძახებთ ფუნქციას. კარგი სახელი გვეუბნება, რას აკეთებს: add_points — „ქულების დამატება“."],
  param: ["პარამეტრი", "„ცარიელი ყუთი“, რომელშიც გამოძახებისას მნიშვნელობა ჩაიდება. აქ score-ში ჩავა 25."],
  colon: ["ორწერტილი :", "სათაურის ბოლოს აუცილებელია. ის ნიშნავს: „აქედან იწყება ფუნქციის ტანი“."],
  body: ["ფუნქციის ტანი", "ბრძანებები ფუნქციის შიგნით. Python-ში ისინი 4 გამოტოვებით იწერება (ინდენტაცია), Scratch-ში კი ბლოკი შიგნითაა ჩასმული."],
  return: ["return — „დააბრუნე“", "აბრუნებს შედეგს იქ, საიდანაც ფუნქცია გამოვიძახეთ. return-ის შემდეგ ფუნქცია მუშაობას ასრულებს."],
  call: ["ფუნქციის გამოძახება", "ფუნქცია მხოლოდ მაშინ მუშაობს, როცა მას ვიძახებთ. add_points(25) → score = 25 → შედეგი 35."],
};
const explored = new Set();
function showTip(el) {
  const key = el.dataset.tip;
  if (!tips[key]) return;
  $$("[data-tip]").forEach((x) => x.classList.toggle("active", x.dataset.tip === key));
  $("#lens-title").textContent = tips[key][0];
  $("#lens-text").textContent = tips[key][1];
  explored.add(key);
  $("#lens-count").textContent = `გამოკვლეულია ${explored.size} / 7 ნაწილი`;
  if (explored.size === 7) markDone("m2");
}
$$("[data-tip]").forEach((el) => {
  el.addEventListener("mouseenter", (e) => { e.stopPropagation(); showTip(el); });
  el.addEventListener("focus", (e) => { e.stopPropagation(); showTip(el); });
  el.addEventListener("click", (e) => { e.stopPropagation(); showTip(el); });
  if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", tips[el.dataset.tip][0]);
});
$$(".sw").forEach((b) => (b.onclick = () => {
  $$(".sw").forEach((x) => { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
  b.classList.add("active"); b.setAttribute("aria-selected", "true");
  $("#bridge").dataset.view = b.dataset.view;
}));

// =====================================================
// მოდული 3: პრაქტიკა
// =====================================================
const tasks = new Set();
function taskSolved(n) {
  tasks.add(n);
  $("#task" + n).classList.add("solved");
  if (tasks.size === 3) markDone("m3");
}
function fb(el, ok, msg) { el.className = "feedback " + (ok ? "ok" : "hint"); el.textContent = (ok ? "🎉 " : "💭 ") + msg; }

// --- დავალება 1: jump(height, distance) ---
// ერთეული = 30px; სტარტი x=60; ყუთი x=170..210 (სიმაღლე 3); ვარსკვლავი x≈330
$("#btn-jump").onclick = async () => {
  const h = +$("#j-h").value, d = +$("#j-d").value;
  const hero = $("#hero"), out = $("#t1-fb");
  out.textContent = ""; out.className = "feedback";
  const startX = 60, endX = startX + d * 60, peak = h * 22;
  const steps = reduceMotion ? 1 : 30;
  // ყუთთან შეჯახების შემოწმება: ყუთის თავზე (x=190) სიმაღლე უნდა იყოს 3-ზე მეტი
  const blocked = h <= 3;
  const stopX = blocked ? 150 : Math.min(endX, 390);
  for (let i = 1; i <= steps; i++) {
    const k = i / steps, x = startX + (stopX - startX) * k;
    const y = 140 - (blocked ? Math.sin(Math.PI * k) * peak * 0.6 : Math.sin(Math.PI * k) * peak);
    hero.style.transform = `translate(${x}px, ${y}px)`;
    await wait(20);
  }
  if (blocked) {
    fb(out, false, `სიმაღლით ${h} ყუთს ვერ გადავახტით — მისი სიმაღლე 3-ია. პარამეტრი height უნდა იყოს ყუთზე მაღალი. რა რიცხვი ჯობს?`);
  } else if (d !== 4) {
    fb(out, false, d < 4 ? `ყუთს გადავახტით, მაგრამ ვარსკვლავამდე ${4 - d} ნაბიჯი დაგვაკლდა. distance-ს რა მნიშვნელობა სჭირდება?` : `ვარსკვლავს გადავაცილეთ ${d - 4} ნაბიჯით! distance უნდა ემთხვეოდეს მანძილს ვარსკვლავამდე.`);
  } else {
    fb(out, true, `ზუსტად! jump(${h}, 4) — ერთი და იგივე ფუნქცია, სხვა არგუმენტებით კი სხვა შედეგს იძლევა. ⭐ +10 ქულა`);
    taskSolved(1);
  }
  await wait(1200);
  hero.style.transform = "translate(60px, 140px)";
};

// --- დავალება 2: DRY ---
const correct = [
  "def discount(price):",
  "    return price - price * 0.2",
  "notebook = discount(5)",
  "pen = discount(2)",
  "backpack = discount(40)",
];
const distractors = ["def discount(price)", "    price - price * 0.2"];
let pool = [], asm = [];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
function renderDry() {
  const P = $("#pool"), A = $("#assembled");
  P.innerHTML = ""; A.innerHTML = "";
  pool.forEach((txt, i) => {
    const b = document.createElement("button");
    b.className = "block"; b.textContent = txt; b.id = `dry-pool-${i}`;
    b.setAttribute("aria-label", `დამატება: ${txt.trim()}`);
    b.onclick = () => { asm.push(txt); pool.splice(i, 1); renderDry(); };
    P.appendChild(b);
  });
  asm.forEach((txt, i) => {
    const b = document.createElement("button");
    b.className = "block"; b.textContent = txt; b.id = `dry-asm-${i}`;
    b.setAttribute("aria-label", `ამოღება: ${txt.trim()}`);
    b.onclick = () => { pool.push(txt); asm.splice(i, 1); renderDry(); };
    A.appendChild(b);
  });
}
function resetDry() { pool = shuffle([...correct, ...distractors]); asm = []; renderDry(); $("#t2-fb").textContent = ""; $("#t2-fb").className = "feedback"; }
resetDry();
$("#btn-dry-reset").onclick = resetDry;
$("#btn-dry-check").onclick = () => {
  const out = $("#t2-fb");
  if (!asm.length) return fb(out, false, "დაიწყე ბლოკით, რომელიც ფუნქციას ქმნის. რომელი სიტყვით იწყება ფუნქციის სათაური?");
  if (asm.includes("def discount(price)")) return fb(out, false, "შეადარე ორი def-იანი ბლოკი. ერთ-ერთს სათაურის ბოლოს რაღაც პატარა, მაგრამ მნიშვნელოვანი აკლია.");
  if (asm.includes("    price - price * 0.2")) return fb(out, false, "ფუნქციამ ფასი დათვალა, მაგრამ შედეგი გარეთ როგორ გამოიტანოს? რომელი სიტყვა აბრუნებს მნიშვნელობას?");
  if (asm[0] !== correct[0]) return fb(out, false, "ფუნქცია ჯერ უნდა შეიქმნას და მერე გამოვიძახოთ. რომელი ბლოკი უნდა იყოს პირველი?");
  if (asm.length < 5) return fb(out, false, `კარგად მიდიხარ! ფუნქცია მზადაა, მაგრამ სამივე ნივთისთვის გამოიძახე? ჯერ ${asm.length} ბლოკი გაქვს 5-დან.`);
  if (asm[1] !== correct[1]) return fb(out, false, "return-ის ხაზი ფუნქციის შიგნით უნდა იყოს — უშუალოდ სათაურის შემდეგ.");
  fb(out, true, "შესანიშნავია! 9 ხაზის ნაცვლად 5 ხაზი. თუ ფასდაკლება 30%-მდე გაიზრდება, საკმარისია ერთი ადგილის შეცვლა. ეს არის DRY პრინციპი!");
  taskSolved(2);
};

// --- დავალება 3: ლოგიკური შეცდომა ---
const cases = [
  {
    title: "ა) მისალმება არ ჩანს",
    screen: "ეკრანი: (ცარიელი)",
    lines: ["def say_hello():", '    print("გამარჯობა, კლასო!")', "", "# პროგრამის დასასრული"],
    bug: 3,
    hint: "ფუნქცია სწორადაა დაწერილი. მაგრამ ფუნქცია ხომ თავისით არ ირთვება... რა უნდა მოხდეს, რომ მან იმუშაოს?",
    ok: "სწორად მიაგენი! ფუნქცია შეიქმნა, მაგრამ არავინ გამოიძახა. გამოსწორება: say_hello()",
  },
  {
    title: "ბ) შედეგი None-ია",
    screen: "ეკრანი: None",
    lines: ["def double(n):", "    result = n * 2", "", "print(double(6))"],
    bug: 1,
    hint: "ფუნქცია ითვლის result-ს, მაგრამ დათვლილი მნიშვნელობა ფუნქციიდან გარეთ გამოდის? გაიხსენე ბლენდერის მე-3 ნაბიჯი.",
    ok: "ზუსტად! result დაითვალა, მაგრამ არ დაბრუნდა. საჭიროა ხაზი: return result",
  },
];
let casesSolved = 0;
cases.forEach((c, ci) => {
  const box = document.createElement("div");
  box.className = "dcase";
  box.innerHTML = `<h4>${c.title}</h4><div class="screen">${c.screen}</div>
    <div class="lines" role="group" aria-label="კოდის ხაზები — აირჩიე პრობლემური ხაზი"></div>
    <p class="feedback" aria-live="polite"></p>`;
  const L = $(".lines", box), out = $(".feedback", box);
  c.lines.forEach((txt, li) => {
    const b = document.createElement("button");
    b.className = "line"; b.id = `dbg-${ci}-${li}`;
    b.textContent = txt || " ";
    b.setAttribute("aria-label", `ხაზი ${li + 1}: ${txt || "ცარიელი"}`);
    b.onclick = () => {
      if (box.dataset.solved) return;
      if (li === c.bug) {
        b.classList.add("picked-ok");
        b.textContent = ci === 0 ? "say_hello()   # ✓ დაემატა" : "    return result   # ✓";
        if (ci === 1) b.textContent = "    result = n * 2\n    return result   # ✓";
        fb(out, true, c.ok);
        box.dataset.solved = "1";
        if (++casesSolved === cases.length) taskSolved(3);
      } else {
        $$(".line", L).forEach((x) => x.classList.remove("picked-try"));
        b.classList.add("picked-try");
        fb(out, false, "ეს ხაზი თავის საქმეს კარგად აკეთებს. " + c.hint);
      }
    };
    L.appendChild(b);
  });
  $("#debug-cases").appendChild(box);
});

// =====================================================
// მოდული 4: ქვიზი
// =====================================================
const quiz = [
  {
    q: "ნინიმ დაწერა ფუნქცია def water_plants(): ... , მაგრამ პროგრამის გაშვებისას არაფერი მოხდა. რატომ?",
    a: ["ფუნქციას ძალიან გრძელი სახელი აქვს", "ფუნქცია შექმნილია, მაგრამ არ არის გამოძახებული", "Python-ში ფუნქციები არ მუშაობს", "ფუნქციას აუცილებლად 3 პარამეტრი სჭირდება"],
    c: 1,
    h: "გაიხსენე ბლენდერი: ის თავისით ირთვება, თუ ვინმემ ღილაკს უნდა დააჭიროს?",
  },
  {
    q: "def area(width, height): return width * height — რას დააბრუნებს area(4, 5)?",
    a: ["9", "45", "20", "width * height"],
    c: 2,
    h: "ჩასვი რიცხვები პარამეტრების ადგილას: width = 4, height = 5. რომელი მოქმედებაა return-ის შემდეგ?",
  },
  {
    q: "სკოლის თამაშში ქულების დათვლის ერთი და იგივე კოდი 10 ადგილასაა. რა არის საუკეთესო გამოსავალი?",
    a: ["კოდის კიდევ ერთხელ დაკოპირება", "ერთი ფუნქციის შექმნა და მისი 10-ჯერ გამოძახება", "კოდის წაშლა", "თითოეულ ასლში სხვა ცვლადის სახელის გამოყენება"],
    c: 1,
    h: "რა მოხდება, თუ ქულების წესი შეიცვლება? რომელ შემთხვევაში მოგიწევს ნაკლებ ადგილას გასწორება? (გაიხსენე DRY)",
  },
  {
    q: "def greet(name): — აქ რა არის name?",
    a: ["პარამეტრი — მნიშვნელობა, რომელსაც ფუნქცია გამოძახებისას იღებს", "ფუნქციის შედეგი", "Python-ის საკვანძო სიტყვა", "შეცდომა, რომელიც უნდა წაიშალოს"],
    c: 0,
    h: "name ფრჩხილებშია. კოდის ლუპაში რას ნიშნავდა ფრჩხილებში მოთავსებული „ცარიელი ყუთი“?",
  },
];
let qSolved = 0;
quiz.forEach((item, qi) => {
  const wrap = document.createElement("div");
  wrap.className = "q";
  wrap.innerHTML = `<fieldset><legend><b>${qi + 1}.</b> ${item.q}</legend>
    ${item.a.map((t, ai) => `<label class="opt"><input type="radio" name="q${qi}" value="${ai}" id="q${qi}-${ai}"> <span>${t}</span></label>`).join("")}
    </fieldset>
    <div class="row"><button class="btn btn-primary" id="q${qi}-check">პასუხის შემოწმება</button></div>
    <p class="feedback" aria-live="polite"></p>`;
  const out = $(".feedback", wrap);
  $(`#q${qi}-check`, wrap).onclick = () => {
    if (wrap.classList.contains("solved")) return;
    const sel = $("input:checked", wrap);
    if (!sel) return fb(out, false, "ჯერ აირჩიე ერთ-ერთი პასუხი — მერე ერთად შევამოწმებთ.");
    if (+sel.value === item.c) {
      fb(out, true, "სწორად ფიქრობ! ძალიან კარგია.");
      wrap.classList.add("solved");
      $$("input", wrap).forEach((i) => (i.disabled = true));
      if (++qSolved === quiz.length) { $("#quiz-done").hidden = false; markDone("m4"); }
    } else {
      sel.closest(".opt").classList.add("tried");
      fb(out, false, "კარგი მცდელობაა! " + item.h);
    }
  };
  $("#quiz").appendChild(wrap);
});
