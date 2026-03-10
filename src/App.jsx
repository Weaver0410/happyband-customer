import { useState, useEffect } from "react";
import { doc, getDoc, addDoc, updateDoc, increment, serverTimestamp, collection } from "firebase/firestore";
import { db } from "./firebase";

// ── The customer site base URL — fixed, no config needed
const BASE_URL = "https://happyband-customer-nfc.netlify.app";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#1B2B5E;--navy2:#152348;--navy3:#0F1A36;
  --gold:#C9A84C;--gold2:#E8C96A;--gold3:#8B6914;
  --cream:#FAFAF7;--warm:#F5F0E8;--border:#E2D9C8;
  --txt:#1a1a2e;--muted:#6B7280;
  --ok:#2D9B6F;--err:#DC4A38;
}
html,body{background:var(--cream);font-family:'Plus Jakarta Sans',sans-serif;color:var(--txt);min-height:100vh;-webkit-font-smoothing:antialiased}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(.3);opacity:0}65%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px rgba(201,168,76,.3)}50%{box-shadow:0 0 28px rgba(201,168,76,.6)}}
.fu{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) forwards}
.fu1{animation:fadeUp .5s .1s cubic-bezier(.22,1,.36,1) both}
.fu2{animation:fadeUp .5s .2s cubic-bezier(.22,1,.36,1) both}
.page{min-height:100vh;max-width:430px;margin:0 auto;background:var(--cream)}
.topbar{background:white;border-bottom:1.5px solid var(--border);padding:14px 20px;display:flex;align-items:center;justify-content:center;position:sticky;top:0;z-index:20;box-shadow:0 2px 14px rgba(27,43,94,.07)}
.logo-row{display:flex;align-items:center;gap:9px}
.logo-txt{font-family:'Libre Baskerville',serif;font-size:18px;font-weight:700;color:var(--navy)}
.logo-txt b{color:var(--gold3)}
.hero{background:linear-gradient(158deg,var(--navy3) 0%,var(--navy) 50%,#213670 100%);padding:40px 24px 36px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;width:280px;height:280px;top:-80px;right:-80px;border-radius:50%;background:rgba(201,168,76,.07);pointer-events:none}
.hero::after{content:'';position:absolute;width:180px;height:180px;bottom:-50px;left:-50px;border-radius:50%;background:rgba(201,168,76,.05);pointer-events:none}
.nfc-badge{position:absolute;top:14px;right:14px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);color:var(--gold2);border-radius:20px;padding:5px 12px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.emp-av{width:88px;height:88px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:white;position:relative;animation:glow 3s ease-in-out infinite}
.emp-av::before{content:'';position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(var(--gold),transparent 40%,var(--gold2) 60%,transparent,var(--gold));z-index:-1;animation:spin 6s linear infinite}
.emp-av::after{content:'';position:absolute;inset:-1px;border-radius:50%;background:var(--navy2);z-index:-1}
.emp-name{font-family:'Libre Baskerville',serif;font-size:25px;font-weight:700;color:white;margin-bottom:4px}
.emp-role{font-size:11px;font-weight:700;color:var(--gold2);letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px}
.stats-row{display:flex;justify-content:center}
.stat{padding:0 18px;text-align:center}
.stat:not(:last-child){border-right:1px solid rgba(255,255,255,.14)}
.stat-v{font-size:17px;font-weight:700;color:white}
.stat-l{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;letter-spacing:.07em;text-transform:uppercase}
.actions{padding:22px 18px 0;display:grid;grid-template-columns:1fr 1fr;gap:11px}
.ab{border-radius:16px;padding:20px 14px;cursor:pointer;border:2px solid transparent;transition:all .22s;display:flex;flex-direction:column;align-items:center;gap:8px}
.ab-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;transition:transform .2s}
.ab:hover .ab-icon{transform:scale(1.12)}
.ab-name{font-size:14px;font-weight:700}
.ab-sub{font-size:11px;opacity:.65}
.ab-tip{background:var(--navy);border-color:var(--navy);color:white}
.ab-tip .ab-icon{background:rgba(201,168,76,.18)}
.ab-tip:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(27,43,94,.32)}
.ab-rev{background:white;border-color:var(--border);color:var(--navy)}
.ab-rev .ab-sub{color:var(--muted)}
.ab-rev:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.09);border-color:var(--navy)}
.panel{padding:20px 18px 60px;display:flex;flex-direction:column;gap:15px}
.pbk{display:flex;align-items:center;gap:7px;color:var(--navy);cursor:pointer;font-size:14px;font-weight:600;width:fit-content;background:none;border:none;font-family:'Plus Jakarta Sans',sans-serif;padding:0}
.pbk:hover{opacity:.65}
.ptitle{font-family:'Libre Baskerville',serif;font-size:22px;color:var(--navy);font-weight:700}
.psub{font-size:13px;color:var(--muted);margin-top:2px}
.card{background:white;border:1.5px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,.04)}
.cs{padding:18px;border-bottom:1.5px solid var(--border)}
.cs:last-child{border-bottom:none}
.cl{font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:4px}
.req-dot{color:var(--err);font-size:14px;line-height:1}
.opt-txt{color:var(--muted);font-weight:400;font-size:10px;margin-left:3px}
.tgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.tpill{background:var(--warm);border:2px solid var(--border);border-radius:12px;padding:13px 0;font-weight:700;font-size:15px;color:var(--navy);cursor:pointer;transition:all .18s;text-align:center;font-family:'Plus Jakarta Sans',sans-serif}
.tpill:hover{border-color:var(--navy)}
.tpill.sel{background:var(--navy);border-color:var(--navy);color:white;box-shadow:0 4px 16px rgba(27,43,94,.28)}
.tcust{position:relative;margin-top:9px}
.tcust input{padding-left:38px;font-size:15px;font-weight:600;color:var(--navy)}
.tcust-pre{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--muted);font-size:15px;pointer-events:none}
.irow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
input,textarea,select{background:var(--warm);border:1.5px solid var(--border);color:var(--txt);border-radius:12px;padding:13px 15px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s,box-shadow .2s;-webkit-appearance:none}
input:focus,textarea:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(27,43,94,.1);background:white}
input::placeholder,textarea::placeholder{color:#B8C0CC;font-weight:400}
textarea{resize:none}
.stars-row{display:flex;gap:4px;justify-content:center}
.sbtn{background:none;border:none;font-size:34px;cursor:pointer;transition:transform .12s;line-height:1;padding:4px}
.sbtn:hover{transform:scale(1.22)}
.star-lbl{text-align:center;font-size:13px;font-weight:600;color:var(--gold3);margin-top:5px;min-height:20px}
.tags-row{display:flex;flex-wrap:wrap;gap:8px}
.tag{border:1.5px solid var(--border);background:var(--warm);color:var(--muted);border-radius:20px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:all .18s;user-select:none}
.tag:hover{border-color:var(--navy);color:var(--navy)}
.tag.sel{background:var(--navy);border-color:var(--navy);color:white}
.mini-rev{background:linear-gradient(135deg,#F0EBF8,#EDE5F8);border:1.5px dashed #C8BAE0;border-radius:14px;padding:16px 16px 18px}
.mini-rev-hd{font-size:11px;font-weight:700;color:var(--navy);letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}
.btn-primary{background:linear-gradient(135deg,var(--navy3),var(--navy));color:white;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;border:none;border-radius:14px;padding:18px;width:100%;cursor:pointer;transition:all .2s;box-shadow:0 4px 18px rgba(27,43,94,.32)}
.btn-primary:hover{box-shadow:0 6px 28px rgba(27,43,94,.45);transform:translateY(-1px)}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none}
.gold-note{text-align:center;font-size:11px;color:var(--muted);display:flex;align-items:center;justify-content:center;gap:5px;margin-top:-6px}
.err{font-size:12px;color:var(--err);margin-top:5px;font-weight:500}
.spin{width:17px;height:17px;border:2.5px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
.spin-dark{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--navy);border-radius:50%;animation:spin .8s linear infinite}
.loading-wrap{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.success-bg{position:fixed;inset:0;background:linear-gradient(158deg,var(--navy3) 0%,var(--navy) 60%,#213670 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:300;padding:40px 32px;text-align:center}
.suc-icon{width:104px;height:104px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:50px;animation:pop .55s cubic-bezier(.34,1.56,.64,1);margin-bottom:24px;box-shadow:0 10px 40px rgba(201,168,76,.55)}
.suc-title{font-family:'Libre Baskerville',serif;font-size:28px;color:white;margin-bottom:10px}
.suc-msg{font-size:15px;color:rgba(255,255,255,.65);line-height:1.7;max-width:280px}
.suc-em{color:var(--gold2);font-weight:700}
.suc-btn{margin-top:36px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.22);color:white;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:12px;border-radius:12px;padding:13px 28px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase}
.suc-btn:hover{background:rgba(255,255,255,.18)}
.info-banner{background:linear-gradient(135deg,var(--navy),#213670);margin:18px 18px 0;border-radius:14px;padding:18px;color:white}
.ib-head{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.ib-body{font-size:14px;color:rgba(255,255,255,.85);line-height:1.6}
.upi-banner{background:linear-gradient(135deg,#1a3a1a,#1e4a1e);margin:12px 18px 0;border-radius:14px;padding:16px 18px;color:white;display:flex;align-items:center;gap:12px}
.upi-icon{font-size:28px;flex-shrink:0}
.upi-id{font-size:13px;font-weight:700;color:#7EE89A;letter-spacing:.02em}
.upi-lbl{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;letter-spacing:.07em;text-transform:uppercase}
.error-box{background:#FEF2F2;border:1.5px solid #FECACA;border-radius:14px;padding:20px;margin:20px;text-align:center}
.error-box h3{color:var(--err);font-size:16px;margin-bottom:8px}
.error-box p{font-size:13px;color:#991B1B;line-height:1.6}
`;

const HBLogo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
    <rect x="10" y="38" width="80" height="52" rx="14" stroke="#1B2B5E" strokeWidth="7.5" fill="none"/>
    <circle cx="50" cy="64" r="13" stroke="#1B2B5E" strokeWidth="7.5" fill="none"/>
    <line x1="50" y1="38" x2="50" y2="18" stroke="#1B2B5E" strokeWidth="7" strokeLinecap="round"/>
    <polyline points="36,24 50,10 64,24" stroke="#1B2B5E" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="50" y1="10" x2="56" y2="3" stroke="#C9A84C" strokeWidth="5.5" strokeLinecap="round"/>
  </svg>
);

const StarsInput = ({ value, onChange }) => {
  const [hov, setHov] = useState(0);
  const lbl = ["","Poor","Fair","Good","Great","Excellent!"];
  return (
    <div>
      <div className="stars-row">
        {[1,2,3,4,5].map(i => (
          <button key={i} className="sbtn"
            onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(0)}
            onClick={()=>onChange(i)}>
            {i<=(hov||value)?"⭐":"☆"}
          </button>
        ))}
      </div>
      <div className="star-lbl">{lbl[hov||value]||"Tap a star to rate"}</div>
    </div>
  );
};

const TAGS = ["Friendly","Fast Service","Professional","Attentive","Needs Improvement"];
const TIP_AMTS = [50, 100, 150, 200];

export default function CustomerPage() {
  // Read employee code from URL: /e/anjali01
  const empCode = window.location.pathname.split('/e/')[1]?.split('/')[0] || null;

  const [emp, setEmp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scr, setScr]         = useState("home");
  const [sucType, setSucType] = useState(null);

  // Tip state
  const [tamt, setTamt]   = useState(null);
  const [tcust, setTcust] = useState("");
  const [tbl, setTbl]     = useState("");
  const [ord, setOrd]     = useState("");
  const [mstars, setMstars] = useState(0);
  const [mtxt, setMtxt]   = useState("");
  const [paying, setPaying] = useState(false);
  const [terr, setTerr]   = useState({});

  // Review state
  const [rstars, setRstars] = useState(0);
  const [rtags, setRtags]   = useState([]);
  const [rtxt, setRtxt]     = useState("");
  const [rtbl, setRtbl]     = useState("");
  const [rord, setRord]     = useState("");
  const [rerr, setRerr]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!empCode) { setNotFound(true); setLoading(false); return; }
    getDoc(doc(db, "employees", empCode))
      .then(snap => {
        if (snap.exists()) setEmp({ id: snap.id, ...snap.data() });
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [empCode]);

  const effAmt = tamt === "c" ? parseInt(tcust)||0 : tamt||0;

  const doPay = async () => {
    const e = {};
    if (!effAmt || effAmt <= 0) e.amt = "Please select or enter a tip amount";
    if (!tbl.trim()) e.tbl = "Table number is required";
    if (Object.keys(e).length) { setTerr(e); return; }
    setTerr({}); setPaying(true);
    try {
      await addDoc(collection(db, "tips"), {
        employeeId: empCode, employeeName: emp.name,
        amount: effAmt, tableNumber: tbl.trim(),
        orderNumber: ord.trim() || null,
        timestamp: serverTimestamp(), createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, "employees", empCode), {
        totalTips: increment(effAmt), tipCount: increment(1),
      });
      if (mstars > 0) {
        await addDoc(collection(db, "reviews"), {
          employeeId: empCode, employeeName: emp.name,
          rating: mstars, reviewText: mtxt.trim() || null, tags: [],
          tableNumber: tbl.trim(), orderNumber: ord.trim() || null,
          timestamp: serverTimestamp(), createdAt: new Date().toISOString(),
          source: "tip_quick_review",
        });
        const newCount = (emp.totalReviews||0) + 1;
        const newAvg = (((emp.avgRating||0)*(emp.totalReviews||0)) + mstars) / newCount;
        await updateDoc(doc(db,"employees",empCode), {
          totalReviews: increment(1), avgRating: parseFloat(newAvg.toFixed(1)),
        });
      }
      setSucType("tip"); setScr("success");
    } catch(err) { setTerr({ submit: "Failed. Please try again." }); }
    finally { setPaying(false); }
  };

  const doReview = async () => {
    const e = {};
    if (!rstars) e.star = "Please select a rating";
    if (!rtbl.trim()) e.tbl = "Table number is required";
    if (Object.keys(e).length) { setRerr(e); return; }
    setRerr({}); setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        employeeId: empCode, employeeName: emp.name,
        rating: rstars, reviewText: rtxt.trim() || null, tags: rtags,
        tableNumber: rtbl.trim(), orderNumber: rord.trim() || null,
        timestamp: serverTimestamp(), createdAt: new Date().toISOString(),
        source: "direct_review",
      });
      const newCount = (emp.totalReviews||0) + 1;
      const newAvg = (((emp.avgRating||0)*(emp.totalReviews||0)) + rstars) / newCount;
      await updateDoc(doc(db,"employees",empCode), {
        totalReviews: increment(1), avgRating: parseFloat(newAvg.toFixed(1)),
      });
      setSucType("review"); setScr("success");
    } catch(err) { setRerr({ submit: "Failed. Please try again." }); }
    finally { setSubmitting(false); }
  };

  const reset = () => {
    setScr("home"); setTamt(null); setTcust(""); setTbl(""); setOrd("");
    setMstars(0); setMtxt(""); setRstars(0); setRtags([]); setRtxt("");
    setRtbl(""); setRord(""); setTerr({}); setRerr({});
  };

  const toggleTag = t => setRtags(p => p.includes(t)?p.filter(x=>x!==t):[...p,t]);

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="topbar"><div className="logo-row"><HBLogo/><div className="logo-txt">HAPPY<b>BAND</b></div></div></div>
        <div className="loading-wrap"><div className="spin-dark"/><p style={{color:"var(--muted)",fontSize:14}}>Loading…</p></div>
      </div>
    </>
  );

  if (notFound) return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="topbar"><div className="logo-row"><HBLogo/><div className="logo-txt">HAPPY<b>BAND</b></div></div></div>
        <div className="error-box" style={{marginTop:40}}>
          <h3>Staff Member Not Found</h3>
          <p>This HappyBand link is invalid or no longer active.<br/>Please contact hotel reception for assistance.</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="topbar">
          <div className="logo-row"><HBLogo/><div className="logo-txt">HAPPY<b>BAND</b></div></div>
        </div>

        {/* HERO */}
        <div className="hero fu">
          <div className="nfc-badge">✦ NFC</div>
          <div className="emp-av" style={{background:emp.color||"#1B2B5E"}}>
            {(emp.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div className="emp-name">{emp.name}</div>
          <div className="emp-role">{emp.role}</div>
          <div className="stats-row">
            <div className="stat"><div className="stat-v">⭐ {emp.avgRating||"—"}</div><div className="stat-l">Rating</div></div>
            <div className="stat"><div className="stat-v">{emp.totalReviews||0}</div><div className="stat-l">Reviews</div></div>
            <div className="stat"><div className="stat-v">₹{((emp.totalTips||0)/1000).toFixed(1)}k</div><div className="stat-l">Tips</div></div>
          </div>
        </div>

        {/* HOME */}
        {scr==="home"&&(
          <>
            <div className="actions fu1">
              <div className="ab ab-tip" onClick={()=>setScr("tip")}>
                <div className="ab-icon">💰</div>
                <div className="ab-name">Send a Tip</div>
                <div className="ab-sub">Show appreciation</div>
              </div>
              <div className="ab ab-rev" onClick={()=>setScr("review")}>
                <div className="ab-icon">✍️</div>
                <div className="ab-name">Write Review</div>
                <div className="ab-sub">Share feedback</div>
              </div>
            </div>
            {/* UPI payment info if available */}
            {emp.upiId && (
              <div className="upi-banner fu2">
                <div className="upi-icon">💳</div>
                <div>
                  <div className="upi-lbl">Pay directly via UPI</div>
                  <div className="upi-id">{emp.upiId}</div>
                </div>
              </div>
            )}
            <div className={`info-banner ${emp.upiId?"":"fu2"}`} style={{marginTop:12}}>
              <div className="ib-head">tap · tip · appreciate</div>
              <div className="ib-body">You were served by <strong style={{color:"#E8C96A"}}>{emp.name}</strong>. Your tip or review goes directly to them!</div>
            </div>
          </>
        )}

        {/* TIP FLOW */}
        {scr==="tip"&&(
          <div className="panel fu">
            <div>
              <button className="pbk" onClick={()=>setScr("home")}><span style={{fontSize:18}}>←</span> Back</button>
              <div className="ptitle">Send a Tip</div>
              <div className="psub">100% goes to {emp.name.split(" ")[0]}</div>
            </div>
            <div className="card">
              <div className="cs">
                <div className="cl">Tip Amount <span className="req-dot">*</span></div>
                <div className="tgrid">
                  {TIP_AMTS.map(a=>(
                    <div key={a} className={`tpill${tamt===a?" sel":""}`} onClick={()=>{setTamt(a);setTcust("");}}>₹{a}</div>
                  ))}
                </div>
                <div className="tcust">
                  <span className="tcust-pre">₹</span>
                  <input type="number" placeholder="Other amount" value={tcust} onChange={e=>{setTcust(e.target.value);setTamt("c");}}/>
                </div>
                {terr.amt&&<div className="err">⚠ {terr.amt}</div>}
              </div>
              <div className="cs">
                <div className="cl">Table & Order</div>
                <div className="irow">
                  <div>
                    <input placeholder="Table No. *" value={tbl} onChange={e=>setTbl(e.target.value)}/>
                    {terr.tbl&&<div className="err">⚠ {terr.tbl}</div>}
                  </div>
                  <input placeholder="Order No. (optional)" value={ord} onChange={e=>setOrd(e.target.value)}/>
                </div>
              </div>
              {emp.upiId&&(
                <div className="cs">
                  <div className="cl">Payment via UPI</div>
                  <div style={{background:"#F0FFF4",border:"1.5px solid #86EFAC",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20}}>💳</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#166534"}}>{emp.upiId}</div>
                      <div style={{fontSize:11,color:"#15803D"}}>Open any UPI app and pay to this ID</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="cs">
                <div className="cl">Quick Review <span className="opt-txt">(optional)</span></div>
                <div className="mini-rev">
                  <div className="mini-rev-hd">⭐ How was your experience?</div>
                  <StarsInput value={mstars} onChange={setMstars}/>
                  {mstars>0&&<textarea style={{marginTop:12}} placeholder="Any comments? (optional)" rows={2} value={mtxt} onChange={e=>setMtxt(e.target.value)}/>}
                </div>
              </div>
              {terr.submit&&<div style={{padding:"0 18px 14px"}} className="err">⚠ {terr.submit}</div>}
            </div>
            <button className="btn-primary" onClick={doPay} disabled={paying}>
              {paying
                ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span className="spin"/>Processing…</span>
                :`Record Tip${effAmt>0?" — ₹"+effAmt:""}`}
            </button>
            <div className="gold-note">🔒 Tip recorded · 100% goes to {emp.name.split(" ")[0]}</div>
          </div>
        )}

        {/* REVIEW FLOW */}
        {scr==="review"&&(
          <div className="panel fu">
            <div>
              <button className="pbk" onClick={()=>setScr("home")}><span style={{fontSize:18}}>←</span> Back</button>
              <div className="ptitle">Leave a Review</div>
              <div className="psub">Your feedback helps {emp.name.split(" ")[0]} grow</div>
            </div>
            <div className="card">
              <div className="cs">
                <div className="cl">Your Rating <span className="req-dot">*</span></div>
                <StarsInput value={rstars} onChange={setRstars}/>
                {rerr.star&&<div className="err" style={{textAlign:"center",marginTop:6}}>⚠ {rerr.star}</div>}
              </div>
              <div className="cs">
                <div className="cl">What stood out? <span className="opt-txt">(optional)</span></div>
                <div className="tags-row">
                  {TAGS.map(t=><span key={t} className={`tag${rtags.includes(t)?" sel":""}`} onClick={()=>toggleTag(t)}>{t}</span>)}
                </div>
              </div>
              <div className="cs">
                <div className="cl">Your Feedback <span className="opt-txt">(optional)</span></div>
                <textarea placeholder={`Tell us about your experience with ${emp.name.split(" ")[0]}…`} rows={4} value={rtxt} onChange={e=>setRtxt(e.target.value)}/>
              </div>
              <div className="cs">
                <div className="cl">Table & Order</div>
                <div className="irow">
                  <div>
                    <input placeholder="Table No. *" value={rtbl} onChange={e=>setRtbl(e.target.value)}/>
                    {rerr.tbl&&<div className="err">⚠ {rerr.tbl}</div>}
                  </div>
                  <input placeholder="Order No. (optional)" value={rord} onChange={e=>setRord(e.target.value)}/>
                </div>
              </div>
              {rerr.submit&&<div style={{padding:"0 18px 14px"}} className="err">⚠ {rerr.submit}</div>}
            </div>
            <button className="btn-primary" onClick={doReview} disabled={submitting} style={{opacity:rstars?1:.5}}>
              {submitting
                ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span className="spin"/>Submitting…</span>
                :"Submit Review"}
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {scr==="success"&&(
          <div className="success-bg">
            <div className="suc-icon">{sucType==="tip"?"💝":"⭐"}</div>
            <div className="suc-title">{sucType==="tip"?"Thank You!":"Submitted!"}</div>
            <div className="suc-msg">
              {sucType==="tip"
                ?<><span className="suc-em">{emp.name.split(" ")[0]}</span> received your tip. Your generosity truly makes their day!</>
                :<>Thank you for reviewing <span className="suc-em">{emp.name.split(" ")[0]}</span>. Your words mean the world!</>}
            </div>
            <button className="suc-btn" onClick={reset}>← Go Back</button>
          </div>
        )}
      </div>
    </>
  );
}
