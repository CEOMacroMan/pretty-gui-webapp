(function(global){
  const store = typeof localStorage !== "undefined" ? localStorage : {getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
  // Theme Manager
  const ThemeManager = (function(){
    const key = 'theme';
    function init(){
      const stored = store.getItem(key);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (prefersDark ? 'dark' : 'light');
      set(theme);
      document.getElementById('theme-toggle').addEventListener('click', toggle);
    }
    function set(theme){
      document.documentElement.setAttribute('data-theme', theme);
      document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
      store.setItem(key, theme);
    }
    function toggle(){
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      set(current === 'dark' ? 'light' : 'dark');
    }
    return { init, set };
  })();

  // Sidebar
  const Sidebar = (function(){
    const key = 'sidebar-open';
    let sidebar, toggleBtn;
    function init(){
      sidebar = document.getElementById('sidebar');
      toggleBtn = document.getElementById('sidebar-toggle');
      const saved = store.getItem(key);
      const open = saved !== null ? saved === 'true' : window.innerWidth >= 768;
      set(open);
      toggleBtn.addEventListener('click', () => set(!sidebar.classList.contains('open')));
    }
    function set(open){
      if(open){
        sidebar.classList.remove('collapsed');
        sidebar.classList.add('open');
      } else {
        sidebar.classList.add('collapsed');
        sidebar.classList.remove('open');
      }
      store.setItem(key, open);
    }
    return { init, set };
  })();

  // Router
  const Router = (function(){
    function init(){
      document.getElementById('btn-latin').addEventListener('click', () => show('latin-panel'));
    }
    function show(id){
      document.querySelectorAll('main .panel').forEach(p => p.classList.add('hidden'));
      const el = document.getElementById(id);
      if(el) el.classList.remove('hidden');
    }
    return { init, show };
  })();

  // Calculator
  const Calculator = (function(){
    const angleKey = 'angle-mode';
    let angleMode = 'DEG';
    let modal, openBtn, closeBtn, screen, keysContainer, clearBtn, backBtn, angleToggle, historyList;
    let current = '';
    let history = [];
    let historyIndex = -1;
    let lastFocused = null;

    const operators = {
      '+': {precedence:2, assoc:'L', func:(a,b)=>a+b},
      '-': {precedence:2, assoc:'L', func:(a,b)=>a-b},
      '*': {precedence:3, assoc:'L', func:(a,b)=>a*b},
      '/': {precedence:3, assoc:'L', func:(a,b)=>a/b},
      '^': {precedence:4, assoc:'R', func:(a,b)=>Math.pow(a,b)},
      '!': {precedence:5, assoc:'L', unary:true, postfix:true, func:(a)=>factorial(a)},
      'neg': {precedence:5, assoc:'R', unary:true, func:(a)=>-a}
    };
    const functions = {
      sin:Math.sin, cos:Math.cos, tan:Math.tan,
      asin:Math.asin, acos:Math.acos, atan:Math.atan,
      sqrt:Math.sqrt, ln:Math.log, log:(x)=>Math.log10(x), abs:Math.abs
    };
    const constants = {pi:Math.PI, e:Math.E};

    function init(){
      modal = document.getElementById('calculator-modal');
      openBtn = document.getElementById('btn-calculator');
      closeBtn = document.getElementById('calc-close');
      screen = document.getElementById('calc-screen');
      keysContainer = document.getElementById('calc-keys');
      clearBtn = document.getElementById('calc-clear');
      backBtn = document.getElementById('calc-back');
      angleToggle = document.getElementById('angle-toggle');
      historyList = document.getElementById('calc-history');

      angleMode = store.getItem(angleKey) || 'DEG';
      angleToggle.textContent = angleMode;
      angleToggle.setAttribute('aria-pressed', angleMode === 'RAD');

      buildKeys();

      openBtn.addEventListener('click', open);
      closeBtn.addEventListener('click', close);
      modal.addEventListener('click', e => { if(e.target === modal) close(); });
      clearBtn.addEventListener('click', clear);
      backBtn.addEventListener('click', backspace);
      angleToggle.addEventListener('click', toggleAngleMode);

      document.addEventListener('keydown', handleKey);

      history = JSON.parse(store.getItem('calc-history') || '[]');
      renderHistory();
    }

    function buildKeys(){
      const keys = [
        '7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','(',')','^','!','pi','e','sin','cos','tan','asin','acos','atan','sqrt','ln','log','abs'
      ];
      keysContainer.innerHTML = '';
      keys.forEach(k => {
        const btn = document.createElement('button');
        btn.textContent = k;
        if(k === '=') btn.setAttribute('data-action','eval');
        else if(['sin','cos','tan','asin','acos','atan','sqrt','ln','log','abs'].includes(k)) btn.setAttribute('data-value', k + '(');
        else btn.setAttribute('data-value', k);
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          if(action === 'eval') evaluate();
          else append(btn.getAttribute('data-value'));
        });
        keysContainer.appendChild(btn);
      });
    }

    function open(){
      lastFocused = document.activeElement;
      modal.classList.remove('hidden');
      screen.focus();
    }
    function close(){
      modal.classList.add('hidden');
      current='';
      updateScreen();
      if(lastFocused) lastFocused.focus();
    }
    function append(val){
      current += val;
      updateScreen();
    }
    function updateScreen(){
      screen.textContent = current;
    }
    function clear(){
      current = '';
      updateScreen();
    }
    function backspace(){
      current = current.slice(0,-1);
      updateScreen();
    }
    function toggleAngleMode(){
      angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
      angleToggle.textContent = angleMode;
      angleToggle.setAttribute('aria-pressed', angleMode === 'RAD');
      store.setItem(angleKey, angleMode);
    }
    function handleKey(e){
      if(modal.classList.contains('hidden')) return;
      const allowed = /[0-9+\-*/^().!]/;
      if(allowed.test(e.key)){
        e.preventDefault();
        append(e.key);
      } else if(e.key === 'Enter'){
        e.preventDefault();
        evaluate();
      } else if(e.key === 'Escape'){
        clear();
      } else if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(history[historyIndex+1]){
          historyIndex++;
          current = history[historyIndex].expr;
          updateScreen();
        }
      } else if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(historyIndex > 0){
          historyIndex--;
          current = history[historyIndex].expr;
          updateScreen();
        } else if(historyIndex === 0){
          historyIndex = -1;
          current = '';
          updateScreen();
        }
      }
    }
    function evaluate(){
      try {
        const result = evaluateExpression(current);
        addHistory(current, result);
        current = String(result);
        updateScreen();
      } catch(err){
        screen.textContent = 'Error';
      }
    }
    function addHistory(expr, res){
      history.unshift({expr, res});
      if(history.length>20) history.pop();
      renderHistory();
      store.setItem('calc-history', JSON.stringify(history));
      historyIndex = -1;
    }
    function renderHistory(){
      historyList.innerHTML='';
      history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.expr} = ${item.res}`;
        li.tabIndex = 0;
        li.addEventListener('click', ()=>{ current = item.expr; updateScreen(); });
        historyList.appendChild(li);
      });
    }

    function tokenize(str){
      const tokens=[]; let i=0;
      while(i<str.length){
        const ch=str[i];
        if(/\d/.test(ch) || ch==='.'){
          let num='';
          while(i<str.length && (/\d/.test(str[i]) || str[i]==='.')){ num+=str[i++]; }
          tokens.push(num); continue;
        }
        if(/[a-z]/i.test(ch)){
          let name='';
          while(i<str.length && /[a-z]/i.test(str[i])) name+=str[i++];
          tokens.push(name);
          continue;
        }
        if('+-*/^()!,'.includes(ch)){
          tokens.push(ch); i++; continue;
        }
        if(ch===' '){ i++; continue; }
        throw new Error('Unexpected character: '+ch);
      }
      return tokens;
    }

    function toRPN(tokens){
      const output=[]; const stack=[];
      let prevType='start';
      tokens.forEach(tok=>{
        if(!isNaN(tok)){
          output.push(parseFloat(tok));
          prevType='number';
        } else if(tok in constants){
          output.push(constants[tok]);
          prevType='number';
        } else if(tok in functions){
          stack.push(tok);
          prevType='func';
        } else if(tok==='('){
          stack.push(tok);
          prevType='left';
        } else if(tok===')'){
          while(stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
          stack.pop();
          if(stack.length && stack[stack.length-1] in functions) output.push(stack.pop());
          prevType='right';
        } else if(tok in operators){
          let op = tok;
          if(op==='-' && (prevType==='start' || prevType==='op' || prevType==='left')) op='neg';
          while(stack.length){
            const top=stack[stack.length-1];
            if(top in operators && ((operators[top].precedence>operators[op].precedence) || (operators[top].precedence===operators[op].precedence && operators[op].assoc==='L'))){
              output.push(stack.pop());
            } else break;
          }
          stack.push(op);
          prevType='op';
        }
      });
      while(stack.length) output.push(stack.pop());
      return output;
    }

    function evalRPN(rpn){
      const stack=[];
      rpn.forEach(tok=>{
        if(typeof tok==='number'){ stack.push(tok); }
        else if(tok in operators){
          const op=operators[tok];
          if(op.postfix){
            const a=stack.pop();
            stack.push(op.func(a));
          } else if(op.unary){
            const a=stack.pop();
            stack.push(op.func(a));
          } else {
            const b=stack.pop();
            const a=stack.pop();
            stack.push(op.func(a,b));
          }
        } else if(tok in functions){
          const a=stack.pop();
          stack.push(callFunction(tok,a));
        }
      });
      if(stack.length!==1) throw new Error('Invalid');
      return stack[0];
    }

    function callFunction(name,val){
      if(['sin','cos','tan'].includes(name)){
        if(angleMode==='DEG') val = val * Math.PI/180;
        return functions[name](val);
      } else if(['asin','acos','atan'].includes(name)){
        const res = functions[name](val);
        return angleMode==='DEG' ? res*180/Math.PI : res;
      }
      return functions[name](val);
    }

    function factorial(n){
      if(n<0 || !Number.isInteger(n)) throw new Error('Bad factorial');
      let r=1; for(let i=2;i<=n;i++) r*=i; return r;
    }

    function evaluateExpression(expr){
      const rpn = toRPN(tokenize(expr.toLowerCase()));
      return evalRPN(rpn);
    }

    function getAngleMode(){ return angleMode; }

    return { init, evaluate:evaluateExpression, setAngleMode:(m)=>{angleMode=m; store.setItem(angleKey,m);}, getAngleMode };
  })();

  // Latin Panel
  const LatinPanel = (function(){
    const lorem = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua'];
    const quotes = [
      {latin:'Fortuna audaces iuvat', es:'La fortuna favorece a los valientes'},
      {latin:'Veni, vidi, vici', es:'Vine, vi, vencí'},
      {latin:'Alea iacta est', es:'La suerte está echada'},
      {latin:'Carpe diem', es:'Aprovecha el día'},
      {latin:'In vino veritas', es:'En el vino está la verdad'},
      {latin:'Et tu, Brute?', es:'¿Tú también, Bruto?'},
      {latin:'Amor vincit omnia', es:'El amor todo lo vence'},
      {latin:'Sic semper tyrannis', es:'Así siempre a los tiranos'},
      {latin:'Tempus fugit', es:'El tiempo vuela'},
      {latin:'Ad astra per aspera', es:'Hacia las estrellas a través de las dificultades'},
      {latin:'Audentes fortuna iuvat', es:'La fortuna ayuda a los audaces'},
      {latin:'Hannibal ad portas', es:'Aníbal está a las puertas'},
      {latin:'Festina lente', es:'Apresúrate despacio'},
      {latin:'Gutta cavat lapidem', es:'La gota horada la piedra'},
      {latin:'Docendo discimus', es:'Enseñando aprendemos'},
      {latin:'Sic parvis magna', es:'La grandeza nace de pequeños comienzos'},
      {latin:'Mens sana in corpore sano', es:'Mente sana en cuerpo sano'},
      {latin:'Panem et circenses', es:'Pan y circo'},
      {latin:'Primus inter pares', es:'El primero entre iguales'},
      {latin:'Quid pro quo', es:'Una cosa por otra'}
    ];
    let btnSentence, btnParagraph, modeToggle, transToggle, copyBtn, output;
    function init(){
      btnSentence = document.getElementById('latin-sentence');
      btnParagraph = document.getElementById('latin-paragraph');
      modeToggle = document.getElementById('latin-mode');
      transToggle = document.getElementById('latin-translation');
      copyBtn = document.getElementById('latin-copy');
      output = document.getElementById('latin-output');
      btnSentence.addEventListener('click', ()=>generate(false));
      btnParagraph.addEventListener('click', ()=>generate(true));
      copyBtn.addEventListener('click', copy);
    }
    function generate(paragraph){
      output.innerHTML='';
      if(modeToggle.checked){
        const count = paragraph ? 3 : 1;
        for(let i=0;i<count;i++){
          const q = quotes[Math.floor(Math.random()*quotes.length)];
          const div = document.createElement('div');
          div.textContent = q.latin;
          if(transToggle.checked){
            const small = document.createElement('span');
            small.className='translation';
            small.textContent = q.es;
            div.appendChild(document.createElement('br'));
            div.appendChild(small);
          }
          output.appendChild(div);
        }
      } else {
        const sentence = () => {
          const n = 8 + Math.floor(Math.random()*8);
          const words=[];
          for(let i=0;i<n;i++) words.push(lorem[Math.floor(Math.random()*lorem.length)]);
          let s=words.join(' ');
          return s.charAt(0).toUpperCase()+s.slice(1)+'.';
        };
        if(paragraph){
          const sentences = 3 + Math.floor(Math.random()*3);
          const arr=[];
          for(let i=0;i<sentences;i++) arr.push(sentence());
          output.textContent = arr.join(' ');
        } else {
          output.textContent = sentence();
        }
      }
    }
    function copy(){
      const text = output.innerText;
      if(navigator.clipboard) navigator.clipboard.writeText(text);
    }
    return { init };
  })();

  function runSmokeTests(){
    const tests=[]; let passed=0;
    function t(name, cond){ tests.push({name, cond}); }
    const prev = Calculator.getAngleMode();
    Calculator.setAngleMode('DEG');
    t('sqrt(9) === 3', Calculator.evaluate('sqrt(9)') === 3);
    t('sin(30) = 0.5 (DEG)', Math.abs(Calculator.evaluate('sin(30)')-0.5)<1e-9);
    Calculator.setAngleMode('RAD');
    t('sin(pi/6) = 0.5 (RAD)', Math.abs(Calculator.evaluate('sin(pi/6)')-0.5)<1e-9);
    t('3! === 6', Calculator.evaluate('3!') === 6);
    t('log(100) === 2', Math.abs(Calculator.evaluate('log(100)')-2)<1e-9);
    t('ln(e) === 1', Math.abs(Calculator.evaluate('ln(e)')-1)<1e-9);
    t('2+3*4=14', Calculator.evaluate('2+3*4')===14);
    t('(2+3)*4=20', Calculator.evaluate('(2+3)*4')===20);
    t('2^3^2=512', Calculator.evaluate('2^3^2')===512);
    Calculator.setAngleMode(prev);
    tests.forEach(ts=>{ if(ts.cond) passed++; else console.error('Smoke test failed:', ts.name); });
    console.log(`Smoke tests: ${passed}/${tests.length} passed`);
  }

  function init(){
    ThemeManager.init();
    Sidebar.init();
    Router.init();
    Calculator.init();
    LatinPanel.init();
    Router.show('latin-panel');
    runSmokeTests();
  }

  if(typeof document !== 'undefined'){
    document.addEventListener('DOMContentLoaded', init);
  }

  global.runSmokeTests = runSmokeTests;
  if(typeof module !== 'undefined'){
    module.exports = { runSmokeTests, evaluate: Calculator.evaluate, setAngleMode: Calculator.setAngleMode, getAngleMode: Calculator.getAngleMode };
  }

})(typeof window !== 'undefined' ? window : globalThis);
