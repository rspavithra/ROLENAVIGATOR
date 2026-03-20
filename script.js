// RoleNavigator - Main Script

// Progress bar
window.addEventListener('scroll',()=>{
  const s=document.documentElement.scrollTop,h=document.documentElement.scrollHeight-document.documentElement.clientHeight;
  document.getElementById('progressBar').style.width=(s/h*100)+'%';
});

// Navbar scroll style
const nav=document.getElementById('navbar');
window.addEventListener('scroll',()=>{
  if(window.scrollY>20){nav.style.background='rgba(255,255,255,.92)';nav.style.boxShadow='0 2px 30px rgba(37,99,235,.1)'}
  else{nav.style.background='rgba(255,255,255,.78)';nav.style.boxShadow='0 1px 20px rgba(37,99,235,.06)'}
});

// Reveal on scroll
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')});},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('hidden');observer.observe(el)});

// ATS score counter
let counted=false;
const atsEl=document.getElementById('atsScore');
new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting&&!counted){
    counted=true;
    setTimeout(()=>{
      const start=performance.now();
      const run=now=>{const p=Math.min((now-start)/2600,1),ease=1-Math.pow(1-p,3);atsEl.textContent=Math.round(70+22*ease)+'%';if(p<1)requestAnimationFrame(run)};
      requestAnimationFrame(run);
    },900);
  }
},{threshold:.5}).observe(atsEl);

// ── NAVBAR DROPDOWN ──
document.querySelectorAll('.nav-dropdown').forEach(dropdown=>{
  const toggle=dropdown.querySelector(':scope>a');
  const menu=dropdown.querySelector('.dropdown-menu');
  menu.querySelectorAll('a').forEach(item=>{
    item.addEventListener('click',()=>{
      menu.style.opacity='0';
      menu.style.pointerEvents='none';
      menu.style.transform='translateX(-50%) translateY(-6px)';
    });
  });
  toggle.addEventListener('click',e=>{
    e.preventDefault();
    const isOpen=menu.style.opacity==='1';
    document.querySelectorAll('.dropdown-menu').forEach(m=>{
      m.style.opacity='0';m.style.pointerEvents='none';m.style.transform='translateX(-50%) translateY(-6px)';
    });
    if(!isOpen){
      menu.style.opacity='1';menu.style.pointerEvents='auto';menu.style.transform='translateX(-50%) translateY(0)';
    }
  });
});
document.addEventListener('click',e=>{
  if(!e.target.closest('.nav-dropdown')){
    document.querySelectorAll('.dropdown-menu').forEach(m=>{
      m.style.opacity='0';m.style.pointerEvents='none';m.style.transform='translateX(-50%) translateY(-6px)';
    });
  }
});

// ── AUTH MODAL LOGIC ──
const overlay=document.getElementById('authOverlay');
const loginBtn=document.getElementById('loginBtn');
const signupBtn=document.getElementById('signupBtn');
const profileWrap=document.getElementById('profileWrap');

function clearAuthFields(){
  ['loginEmail','loginPassword','signupFirst','signupLast','signupEmail','signupPassword'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.value='';
  });
}

function openAuth(panel){
  showPanel(panel);
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(clearAuthFields,0);
}
function closeAuth(){
  overlay.classList.remove('open');
  document.body.style.overflow='';
}
function showPanel(panel){
  document.getElementById('panelLogin').style.display=panel==='login'?'':'none';
  document.getElementById('panelSignup').style.display=panel==='signup'?'':'none';
  setTimeout(clearAuthFields,0);
}

loginBtn.addEventListener('click',()=>openAuth('login'));
signupBtn.addEventListener('click',e=>{e.preventDefault();openAuth('signup');});
document.getElementById('authClose').addEventListener('click',closeAuth);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeAuth();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAuth();});

function activateProfile(name){
  loginBtn.style.display='none';
  signupBtn.style.display='none';
  profileWrap.style.display='flex';
  const initial=name?name.trim().charAt(0).toUpperCase():'U';
  document.getElementById('profileInitial').textContent=initial;
  const nameItem=document.getElementById('profileNameItem');
  if(nameItem)nameItem.textContent='Signed in as '+name.trim();
}

async function handleLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const password=document.getElementById('loginPassword').value.trim();
  if(!email||!password){alert('Email and password are required.');return;}
  try{
    const res=await fetch('/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,password})
    });
    const data=await res.json().catch(()=>null);
    if(res.ok){
      closeAuth();
      activateProfile(data?.name||email.split('@')[0]||'User');
    } else {
      alert(data?.message||'Invalid email or password.');
    }
  } catch(err){
    alert('Could not reach server. Make sure the backend is running.');
  }
}

async function handleSignup(){
  const first=(document.getElementById('signupFirst')?.value||'').trim();
  const last=(document.getElementById('signupLast')?.value||'').trim();
  const email=(document.getElementById('signupEmail')?.value||'').trim();
  const password=(document.getElementById('signupPassword')?.value||'').trim();
  if(!email||!password){alert('Email and password are required.');return;}
  const name=(first||'User')+(last?' '+last:'');
  try{
    const res=await fetch('/signup',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,email,password})
    });
    const data=await res.json().catch(()=>null);
    if(res.ok){
      closeAuth();
      activateProfile(name);
    } else {
      alert(data?.message||'Signup failed. Please try again.');
    }
  } catch(err){
    alert('Could not reach server. Make sure the backend is running on http://localhost:5000');
  }
}

// ── GOOGLE OAUTH ──
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

function openGoogleSignIn(){
  if(GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID'){
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin + window.location.pathname,
      response_type: 'token',
      scope: 'openid email profile',
      prompt: 'select_account'
    });
    const popup = window.open(
      'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString(),
      'googleSignIn',
      'width=500,height=600,left=' + (screen.width/2-250) + ',top=' + (screen.height/2-300)
    );
    const timer = setInterval(()=>{
      try{
        if(popup.closed){ clearInterval(timer); return; }
        const hash = popup.location.hash;
        if(hash && hash.includes('access_token')){
          clearInterval(timer);
          popup.close();
          const token = new URLSearchParams(hash.slice(1)).get('access_token');
          fetch('https://www.googleapis.com/oauth2/v3/userinfo?access_token='+token)
            .then(r=>r.json())
            .then(info=>{
              const name = info.given_name || info.name || info.email || 'User';
              closeAuth();
              activateProfile(name);
            });
        }
      }catch(e){}
    }, 500);
  } else {
    showGoogleDemoPicker();
  }
}

function showGoogleDemoPicker(){
  const picker = document.createElement('div');
  picker.id = 'googlePicker';
  picker.style.cssText = `
    position:fixed;inset:0;z-index:10000;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,.45);backdrop-filter:blur(6px);
  `;
  picker.innerHTML = `
    <div id="googlePickerBox" style="background:#fff;border-radius:16px;padding:32px 28px;width:360px;
                box-shadow:0 24px 80px rgba(0,0,0,.22);font-family:'Plus Jakarta Sans',sans-serif;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span style="font-size:16px;font-weight:700;color:#1e293b">Sign in with Google</span>
      </div>
      <p style="font-size:12.5px;color:#64748b;margin-bottom:18px">Choose an account to continue to RoleNavigator</p>
      ${['Alex Johnson · alex@gmail.com','Jordan Lee · jordan@gmail.com','Add another account'].map((acc,i)=>`
        <div onclick="selectDemoAccount(${i})" style="display:flex;align-items:center;gap:12px;padding:12px 14px;
             border-radius:10px;cursor:pointer;transition:background .15s;margin-bottom:6px;
             ${i===2?'border:1.5px dashed #cbd5e1;color:#64748b':'border:1.5px solid #f1f5f9;'}"
             onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
          ${i<2?`<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                            display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:15px;flex-shrink:0">
                  ${acc.charAt(0)}</div>`
               :`<div style="width:36px;height:36px;border-radius:50%;background:#f1f5f9;
                            display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px">+</div>`}
          <div>
            <div style="font-size:13.5px;font-weight:600;color:#1e293b">${acc.split(' · ')[0]}</div>
            ${acc.includes('·')?`<div style="font-size:12px;color:#94a3b8">${acc.split(' · ')[1]}</div>`:''}
          </div>
        </div>`).join('')}
      <button onclick="document.getElementById('googlePicker').remove()"
        style="margin-top:12px;width:100%;padding:10px;border:none;background:none;
               color:#64748b;font-family:inherit;font-size:13px;cursor:pointer;border-radius:8px"
        onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">Cancel</button>
    </div>
  `;
  document.body.appendChild(picker);
}

async function selectDemoAccount(idx){
  const accounts = [
    {name:'Alex Johnson', email:'alex@gmail.com', password:'google_oauth'},
    {name:'Jordan Lee',   email:'jordan@gmail.com', password:'google_oauth'}
  ];

  if(idx < accounts.length){
    // Existing account — sign in directly
    document.getElementById('googlePicker')?.remove();
    const account = accounts[idx];
    try{
      let res = await fetch('/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:account.email, password:account.password})
      });
      if(!res.ok){
        res = await fetch('/signup',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(account)
        });
      }
      const data = await res.json().catch(()=>null);
      closeAuth();
      activateProfile(data?.name || account.name);
    } catch(err){
      closeAuth();
      activateProfile(account.name);
    }
  } else {
    // "Add another account" — show inline form inside picker
    const box = document.getElementById('googlePickerBox');
    box.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span style="font-size:16px;font-weight:700;color:#1e293b">Add your account</span>
      </div>
      <div style="margin-bottom:12px">
        <label style="font-size:12.5px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Full name</label>
        <input id="gPickerName" type="text" placeholder="Your name" autocomplete="off"
          style="width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;
                 font-family:inherit;font-size:14px;outline:none;color:#1e293b;background:#f8fafc">
      </div>
      <div style="margin-bottom:18px">
        <label style="font-size:12.5px;font-weight:700;color:#374151;display:block;margin-bottom:5px">Email address</label>
        <input id="gPickerEmail" type="email" placeholder="you@example.com" autocomplete="off"
          style="width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:10px;
                 font-family:inherit;font-size:14px;outline:none;color:#1e293b;background:#f8fafc">
      </div>
      <button onclick="submitGoogleAccount()"
        style="width:100%;padding:13px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);
               color:white;border:none;border-radius:10px;font-family:inherit;
               font-size:14.5px;font-weight:700;cursor:pointer;margin-bottom:10px">
        Continue →
      </button>
      <button onclick="document.getElementById('googlePicker').remove()"
        style="width:100%;padding:10px;border:none;background:none;color:#64748b;
               font-family:inherit;font-size:13px;cursor:pointer;border-radius:8px"
        onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">Cancel</button>
    `;
    setTimeout(()=>document.getElementById('gPickerName')?.focus(), 50);
  }
}

async function submitGoogleAccount(){
  const name=(document.getElementById('gPickerName')?.value||'').trim();
  const email=(document.getElementById('gPickerEmail')?.value||'').trim();
  if(!name||!email){ alert('Please enter both name and email.'); return; }
  document.getElementById('googlePicker')?.remove();
  const account={name,email,password:'google_oauth'};
  try{
    let res=await fetch('/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,password:'google_oauth'})
    });
    if(!res.ok){
      res=await fetch('/signup',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(account)
      });
    }
    const data=await res.json().catch(()=>null);
    closeAuth();
    activateProfile(data?.name||name);
  } catch(err){
    closeAuth();
    activateProfile(name);
  }
}

function initGoogleAuth(){
  // Called when GSI script loads
}

// Google button — event delegation works for both login and signup panels
document.getElementById('authOverlay').addEventListener('click',e=>{
  if(e.target.closest('.auth-social-btn')) openGoogleSignIn();
});

// Hero "Get Started" and CTA button opens signup
document.querySelectorAll('.btn-primary, .btn-white').forEach(btn=>{
  if(btn.textContent.trim().startsWith('Get Started')){
    btn.addEventListener('click',e=>{e.preventDefault();openAuth('signup');});
  }
});

function togglePw(id,btn){
  const inp=document.getElementById(id);
  const isText=inp.type==='text';
  inp.type=isText?'password':'text';
  btn.innerHTML=isText
    ?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
    :'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
}

document.getElementById('logoutBtn').addEventListener('click',e=>{
  e.preventDefault();
  loginBtn.style.display='';
  signupBtn.style.display='';
  profileWrap.style.display='none';
  document.getElementById('profileInitial').textContent='?';
  const nameItem=document.getElementById('profileNameItem');
  if(nameItem)nameItem.textContent='';
});

// Profile dropdown — click toggle
const profileIcon=document.getElementById('profileIcon');
const profileDropdown=document.getElementById('profileDropdown');
profileIcon.addEventListener('click',e=>{
  e.stopPropagation();
  const isOpen=profileDropdown.style.opacity==='1';
  profileDropdown.style.opacity=isOpen?'0':'1';
  profileDropdown.style.pointerEvents=isOpen?'none':'auto';
  profileDropdown.style.transform=isOpen?'translateY(-6px)':'translateY(0)';
});
document.addEventListener('click',()=>{
  profileDropdown.style.opacity='0';
  profileDropdown.style.pointerEvents='none';
  profileDropdown.style.transform='translateY(-6px)';
});