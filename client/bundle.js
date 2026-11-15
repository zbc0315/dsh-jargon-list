/* 由 tools/build.mjs 从 src/client/index.js 生成 —— 请勿手改；重新生成：npm run build */
window.__ModuleLoader__.load({
  id: "@tom2012/dsh-jargon-list",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    var ae=Object.defineProperty;var rr=Object.getOwnPropertyDescriptor;var tr=Object.getOwnPropertyNames;var nr=Object.prototype.hasOwnProperty;var or=(e,r)=>{for(var t in r)ae(e,t,{get:r[t],enumerable:!0})},ar=(e,r,t,n)=>{if(r&&typeof r=="object"||typeof r=="function")for(let a of tr(r))!nr.call(e,a)&&a!==t&&ae(e,a,{get:()=>r[a],enumerable:!(n=rr(r,a))||n.enumerable});return e};var ir=e=>ar(ae({},"__esModule",{value:!0}),e);var Wr={};or(Wr,{LOCALE_NS:()=>me,TAB_ID:()=>he,TAB_KIND:()=>ne,apply:()=>Fr,inject:()=>Br});module.exports=ir(Wr);var pt=require("react");var T=require("react/jsx-runtime"),R={fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round"};function je({size:e=20}){return(0,T.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:[(0,T.jsx)("path",{d:"M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13Z",...R}),(0,T.jsx)("path",{d:"M8.5 9h7M8.5 12.5h7M8.5 16h4",...R})]})}function Te({size:e=16}){return(0,T.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:[(0,T.jsx)("path",{d:"M5.5 6A1.5 1.5 0 0 1 7 4.5h10A1.5 1.5 0 0 1 18.5 6v12.5A1.5 1.5 0 0 1 17 20H7a1.5 1.5 0 0 1-1.5-1.5V6Z",...R}),(0,T.jsx)("path",{d:"M9 9.5h6M9 13h6M9 16.5h3.5",...R})]})}function Ee({size:e=13}){return(0,T.jsx)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:(0,T.jsx)("path",{d:"M12 5.5v13M5.5 12h13",...R})})}function ke({size:e=13}){return(0,T.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:[(0,T.jsx)("circle",{cx:"11",cy:"11",r:"5.75",...R}),(0,T.jsx)("path",{d:"M15.4 15.4 19 19",...R})]})}function Se({size:e=12}){return(0,T.jsx)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:(0,T.jsx)("path",{d:"M6 6l12 12M18 6 6 18",...R})})}var H=require("react"),Ne="jargonList",Ce={title:"黑话单",guideDescription:"本项目里 agent 起的简称与它们的详细含义",open:"打开黑话单",search:"搜索黑话或说明",new:"新增",save:"保存",cancel:"取消",edit:"编辑",delete:"删除",confirmDelete:"再点一次删除",expand:"展开",collapse:"收起",emptyTitle:"还没有黑话",emptyHint:"点右上角「新增」，或让 agent 用 jargon_save 记一条。",loading:"加载中…",retry:"重试",termLabel:"黑话",definitionLabel:"详细说明",termPlaceholder:"例如：三件套",definitionPlaceholder:"它具体指什么：步骤、范围、产出……",errorNoSession:"当前会话不在运行，黑话单不可用。",errorNoWorkspace:"当前会话没有工作目录。",errorCorrupt:"黑话数据文件损坏，已停止写入：{file}",errorInvalidTerm:"黑话不能为空，且不超过 80 字。",errorDuplicateTerm:"已存在同名黑话。",errorDefinitionTooLong:"详细说明不能超过 4000 字。",errorNotFound:"这条黑话已经被删除。",errorNetwork:"连不上黑话服务，请确认 dsh web 正在运行后重试。",errorUnknown:"出错了。",newTermTitle:"新增黑话",editTermTitle:"编辑黑话",editorHint:"⌘/Ctrl+Enter 保存 · Esc 取消",saving:"保存中…",noResults:"没有匹配的黑话",clearSearch:"清空搜索",byAgent:"agent",byUser:"我",metaBy:"{who} 记于 {time}"},Le={title:"Jargon List",guideDescription:"Short names coined in this project and what they mean",open:"Open Jargon List",search:"Search terms or meanings",new:"New",save:"Save",cancel:"Cancel",edit:"Edit",delete:"Delete",confirmDelete:"Click again to delete",expand:"Expand",collapse:"Collapse",emptyTitle:"No jargon yet",emptyHint:"Use New above, or let the agent record one with jargon_save.",loading:"Loading…",retry:"Retry",termLabel:"Term",definitionLabel:"Meaning",termPlaceholder:"e.g. the triple check",definitionPlaceholder:"What it actually means: steps, scope, output…",errorNoSession:"This session is not running, so the Jargon List is unavailable.",errorNoWorkspace:"This session has no working directory.",errorCorrupt:"The jargon data file is corrupt; writing is disabled: {file}",errorInvalidTerm:"A term is required and must be at most 80 characters.",errorDuplicateTerm:"A term with this name already exists.",errorDefinitionTooLong:"The meaning must be at most 4000 characters.",errorNotFound:"That term was already deleted.",errorNetwork:"Cannot reach the jargon service. Make sure dsh web is running, then retry.",errorUnknown:"Something went wrong.",newTermTitle:"New term",editTermTitle:"Edit term",editorHint:"⌘/Ctrl+Enter saves · Esc cancels",saving:"Saving…",noResults:"Nothing matched",clearSearch:"Clear search",byAgent:"agent",byUser:"me",metaBy:"recorded by {who} · {time}"},sr={zh:Ce,en:Le};function ie(e,r){try{if(e&&typeof e.get=="function"){let t=e.get(r);if(t!==void 0)return t}}catch{}try{return e?e[r]:void 0}catch{return}}function lr(){try{let e=typeof document<"u"&&document.documentElement.lang||"zh-CN";return String(e).toLowerCase().startsWith("zh")?"zh":"en"}catch{return"zh"}}function cr(e,r){return typeof e!="string"?"":r?e.replace(/\{(\w+)\}/g,(t,n)=>n in r?String(r[n]):t):e}function dr(e){let r=(e||lr())==="en"?Le:Ce;return(t,n)=>{let a=Object.prototype.hasOwnProperty.call(r,t)?r[t]:t;return cr(a,n)}}function Ie(e){let r=ie(e,"locale");return!r||typeof r.register!="function"?()=>{}:r.register(Ne,sr)}function se(e){let r=ie(e,"locale");try{if(r&&typeof r.bind=="function")return r.bind(Ne)}catch{}return dr()}function W(e){let[r,t]=(0,H.useState)(0);return(0,H.useEffect)(()=>{let n=ie(e,"locale"),a;try{n&&typeof n.subscribe=="function"&&(a=n.subscribe(()=>t(o=>o+1)))}catch{a=void 0}return()=>{if(typeof a=="function")try{a()}catch{}}},[e]),(0,H.useMemo)(()=>se(e),[e,r])}var g=require("react");var ur="/-/jargon",fr="network",Q=class extends Error{constructor(r,t,n){super(t||r||"request failed"),this.name="ApiError",this.code=r||"unknown",this.status=n}};function pr(e){return e===404?"jargon route not found (host plugin may not be mounted)":e===403||e===401?"the host rejected the request (not authorized)":e===409?"the jargon file changed in a conflicting way":e===413?"request body too large":e===503?"the host service is unavailable; restart dsh web":e>=500?"host internal error":`HTTP ${e}`}function gr(e){return e===401?"unauthorized":e===403?"forbidden":e===404?"not-found":e===413?"too-large":e===503?"unavailable":"http-error"}function hr(e){let r=[];for(let[t,n]of Object.entries(e||{}))n==null||n===""||r.push(`${encodeURIComponent(t)}=${encodeURIComponent(String(n))}`);return r.length?`?${r.join("&")}`:""}async function mr(e){let r=null;try{r=await e.json()}catch{r=null}let t=r&&r.ok===!1?r.error:null;if(!e.ok||t){let n=t&&t.code?t.code:gr(e.status),a=t&&t.message?t.message:pr(e.status);throw new Q(n,a,e.status)}return r||{}}function U(e){return!!e&&(e.name==="AbortError"||e.code===20)}function br({fetch:e,base:r=ur}={}){let t=typeof e=="function"?e:(...o)=>globalThis.fetch(...o),n=o=>`${r}${o}`;async function a(o,s){let u;try{u=await t(n(o),{credentials:"same-origin",...s})}catch(c){if(U(c))throw c;let i=c&&c.message?c.message:"network error";throw new Q(fr,i,0)}return mr(u)}return{base:r,state({session:o,cwd:s,signal:u}={}){return a(`/state${hr({session:o,cwd:s})}`,{signal:u,method:"GET"})},mutate({session:o,cwd:s,action:u,id:c,term:i,definition:f,signal:m}={}){let p={session:o,cwd:s,action:u};return c!==void 0&&(p.id=c),i!==void 0&&(p.term=i),f!==void 0&&(p.definition=f),a("/mutate",{method:"POST",signal:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(p)})}}}var z=br();function Ae(e,r){let t=Array.isArray(e)?e:[],n=String(r??"").trim().toLowerCase();return n===""?t:t.filter(a=>{if(!a)return!1;let o=String(a.term===void 0||a.term===null?"":a.term).toLowerCase(),s=String(a.definition===void 0||a.definition===null?"":a.definition).toLowerCase();return o.includes(n)||s.includes(n)})}function De(e){let r=String(e??"");return r===""?!1:r.length>120?!0:r.split(/\r\n|\r|\n/).length>3}function G(e,r,t,n){let a=typeof n=="function"?n:o=>o;switch(e){case"no-session":return a("errorNoSession");case"no-workspace":return a("errorNoWorkspace");case"corrupt":return a("errorCorrupt",{file:t||r||""});case"invalid-term":return a("errorInvalidTerm");case"duplicate-term":return a("errorDuplicateTerm");case"definition-too-long":return a("errorDefinitionTooLong");case"not-found":return a("errorNotFound");case"network":return a("errorNetwork");default:return r||a("errorUnknown")}}function le({current:e,response:r}={}){return!e||!r||e.session!==r.session?!0:typeof r.seq=="number"&&typeof e.seq=="number"?r.seq<e.seq:!1}function _e(e){if(!e)return"";let r=e instanceof Date?e:new Date(e);if(Number.isNaN(r.getTime()))return"";let t=n=>String(n).padStart(2,"0");return`${t(r.getMonth()+1)}-${t(r.getDate())} ${t(r.getHours())}:${t(r.getMinutes())}`}function Re(e,r){let t=typeof r=="function"?r:n=>n;return t(e==="agent"?"byAgent":"byUser")}var ee=require("react");function ce(e,r){try{if(e&&typeof e.get=="function")return e.get(r)}catch{}}function yr(e,r){try{let n=ce(e,"workspaces"),a=n&&n.list&&n.list.getSnapshot(),s=(a&&a.items||[]).find(u=>u&&u.path===r);if(s){let u=s.title||s.displayTitle||s.name;if(u)return u}}catch{}let t=String(r).split(/[\\/]/).filter(Boolean);return t.length?t[t.length-1]:String(r)}function K(e,r){if(!r)return null;try{let t=ce(e,"sessions"),n=t&&t.list&&t.list.getSnapshot(),a=n&&n.byId&&n.byId[r],o=a&&a.cwd;return typeof o!="string"||o===""?null:{cwd:o,title:yr(e,o)}}catch{return null}}function Me(e,r){let[t,n]=(0,ee.useState)(()=>K(e,r));return(0,ee.useEffect)(()=>{n(K(e,r));let a=ce(e,"sessions"),o=a&&a.list;if(!o||typeof o.subscribe!="function")return;let s;try{s=o.subscribe(()=>n(K(e,r)))}catch{s=void 0}return()=>{if(typeof s=="function")try{s()}catch{}}},[e,r]),t}var l=require("react/jsx-runtime");var xr={phase:"idle",terms:[],revision:null,file:null,error:null};function P(e){let r=e.current;if(e.current=null,!!r)try{r.abort()}catch{}}function de(){try{return typeof document>"u"||document.visibilityState!=="hidden"}catch{return!0}}function Oe(e,r){return{phase:"ready",terms:Array.isArray(e.terms)?e.terms:[],revision:e.revision||null,file:e.file||r&&r.file||null,error:null}}function He({draft:e,t:r,saving:t,error:n,onDraftChange:a,onSave:o,onCancel:s,autoFocus:u}){return(0,l.jsxs)("form",{className:"jargon-editor",onSubmit:i=>{i.preventDefault(),o()},onKeyDown:i=>{if(i.key==="Escape"){i.preventDefault(),i.stopPropagation(),s();return}i.key==="Enter"&&(i.metaKey||i.ctrlKey)&&(i.preventDefault(),o())},children:[(0,l.jsx)("div",{className:"jargon-editor-title",children:e.id?r("editTermTitle"):r("newTermTitle")}),(0,l.jsxs)("label",{className:"jargon-field",children:[(0,l.jsx)("span",{className:"jargon-field-label",children:r("termLabel")}),(0,l.jsx)("input",{className:"jargon-input",type:"text",value:e.term,maxLength:120,autoFocus:u,placeholder:r("termPlaceholder"),onChange:i=>a({term:i.target.value})})]}),(0,l.jsxs)("label",{className:"jargon-field",children:[(0,l.jsx)("span",{className:"jargon-field-label",children:r("definitionLabel")}),(0,l.jsx)("textarea",{className:"jargon-textarea",value:e.definition,rows:5,placeholder:r("definitionPlaceholder"),onChange:i=>a({definition:i.target.value})})]}),n?(0,l.jsx)("p",{className:"jargon-form-error",role:"alert",children:n}):null,(0,l.jsxs)("div",{className:"jargon-editor-actions",children:[(0,l.jsx)("button",{type:"submit",className:"jargon-btn is-primary",disabled:t,children:r(t?"saving":"save")}),(0,l.jsx)("button",{type:"button",className:"jargon-btn",onClick:s,disabled:t,children:r("cancel")}),(0,l.jsx)("span",{className:"jargon-editor-hint",children:r("editorHint")})]})]})}function jr({item:e,t:r,expanded:t,armed:n,deleting:a,onEdit:o,onDelete:s,onToggleExpand:u}){let c=De(e.definition);return(0,l.jsxs)("li",{className:"jargon-row",children:[(0,l.jsxs)("div",{className:"jargon-row-head",children:[(0,l.jsx)("span",{className:"jargon-term",children:e.term}),(0,l.jsxs)("span",{className:"jargon-row-actions",children:[(0,l.jsx)("button",{type:"button",className:"jargon-link",onClick:()=>o(e),children:r("edit")}),(0,l.jsx)("button",{type:"button",className:n?"jargon-link is-danger is-armed":"jargon-link is-danger",onClick:()=>s(e),disabled:a,"aria-label":r(n?"confirmDelete":"delete"),children:r(a?"delete":n?"confirmDelete":"delete")})]})]}),(0,l.jsx)("p",{className:c&&!t?"jargon-def is-collapsed":"jargon-def",children:e.definition}),c?(0,l.jsx)("button",{type:"button",className:"jargon-link jargon-expand",onClick:()=>u(e.id),children:r(t?"collapse":"expand")}):null,(0,l.jsx)("p",{className:"jargon-meta",children:r("metaBy",{who:Re(e.updatedBy,r),time:_e(e.updatedAt)})})]})}var ue=class extends g.Component{constructor(r){super(r),this.state={error:null},this.retry=()=>this.setState({error:null})}static getDerivedStateFromError(r){return{error:r}}componentDidCatch(r){try{console.error("[jargon-list] panel crashed",r)}catch{}}render(){if(this.state.error){let r=this.state.error&&this.state.error.message||String(this.state.error);return(0,l.jsxs)("div",{className:"jargon-panel jargon-crash",children:[(0,l.jsx)("div",{className:"jargon-empty-title",children:this.props.label}),(0,l.jsx)("div",{className:"jargon-error-detail",children:r}),(0,l.jsx)("button",{type:"button",className:"jargon-btn",onClick:this.retry,children:this.props.retryLabel})]})}return this.props.children}};function ze(e){let{ctx:r}=e,t=W(r);return(0,l.jsx)(ue,{label:t("errorUnknown"),retryLabel:t("retry"),children:(0,l.jsx)(Tr,{...e})})}function Tr(e){let{ctx:r,sessionId:t,useTabInfo:n}=e,a=W(r),o=typeof e.t=="function"?e.t:a,s=typeof n=="function"?n():null,u=!s||!s.tab||s.tab.visible!==!1,c=Me(r,t),i=c?c.cwd:null,[f,m]=(0,g.useState)(xr),[p,w]=(0,g.useState)(""),[j,k]=(0,g.useState)(()=>new Set),[x,I]=(0,g.useState)(null),[N,_]=(0,g.useState)(!1),[B,b]=(0,g.useState)(null),[C,E]=(0,g.useState)(null),[A,L]=(0,g.useState)(null),S=(0,g.useRef)(!0),be=(0,g.useRef)(0),V=(0,g.useRef)({seq:0,session:t}),Y=(0,g.useRef)(null),$=(0,g.useRef)(null),q=(0,g.useRef)(null),D=(0,g.useCallback)(()=>{q.current!==null&&(clearTimeout(q.current),q.current=null)},[]);(0,g.useEffect)(()=>(S.current=!0,()=>{S.current=!1,D(),P(Y),P($)}),[D]);let M=(0,g.useCallback)(async({silent:d=!1}={})=>{if(!t)return;let v={seq:be.current+=1,session:t};V.current=v,P(Y);let h=typeof AbortController=="function"?new AbortController:null;if(Y.current=h,!i){if(!S.current)return;m(y=>({...y,phase:"error",error:{code:"no-workspace",message:""}}));return}!d&&S.current&&m(y=>y.phase==="ready"?{...y,phase:"refreshing"}:{...y,phase:"loading"});try{let y=await z.state({session:t,cwd:i,signal:h?h.signal:void 0});if(!S.current||le({current:V.current,response:v}))return;m(Oe(y,null))}catch(y){if(U(y)||!S.current||le({current:V.current,response:v}))return;m(er=>({...er,phase:"error",error:{code:y.code||"http-error",message:y.message||""}}))}},[t,i]);(0,g.useEffect)(()=>{M()},[M]),(0,g.useEffect)(()=>{if(!u)return;let d=null,v=()=>{d!==null&&(clearInterval(d),d=null)},h=()=>{d===null&&(d=setInterval(()=>{de()&&M({silent:!0})},2e3))},y=()=>{de()?(M({silent:!0}),h()):v()};return de()&&h(),typeof document<"u"&&document.addEventListener("visibilitychange",y),()=>{v(),typeof document<"u"&&document.removeEventListener("visibilitychange",y)}},[u,M]);let Z=(0,g.useCallback)(d=>{P(Y);let v={seq:be.current+=1,session:t};V.current=v,m(h=>Oe(d,h))},[t]),X=(0,g.useCallback)(()=>{I(null),b(null)},[]),Ge=(0,g.useCallback)(()=>{D(),E(null),b(null),I({id:null,term:"",definition:""})},[D]),Ke=(0,g.useCallback)(d=>{D(),E(null),b(null),I({id:d.id,term:d.term,definition:d.definition})},[D]),ye=(0,g.useCallback)(d=>{I(v=>v&&{...v,...d})},[]),we=(0,g.useCallback)(async()=>{if(!x||N)return;if(!i){b(G("no-workspace","",f.file,o));return}let d=String(x.term||"").trim(),v=String(x.definition||"").trim();if(d===""){b(G("invalid-term","",f.file,o));return}_(!0),b(null),P($);let h=typeof AbortController=="function"?new AbortController:null;$.current=h;try{let y=await z.mutate({session:t,cwd:i,action:"save",...x.id?{id:x.id}:{},term:d,definition:v,signal:h?h.signal:void 0});if(!S.current)return;Z(y),X()}catch(y){if(U(y)||!S.current)return;b(G(y.code,y.message,f.file,o))}finally{S.current&&_(!1)}},[Z,X,i,f.file,x,N,t,o]),ve=(0,g.useCallback)(async d=>{if(!i){m(h=>({...h,phase:"error",error:{code:"no-workspace",message:""}}));return}L(d.id),P($);let v=typeof AbortController=="function"?new AbortController:null;$.current=v;try{let h=await z.mutate({session:t,cwd:i,action:"delete",id:d.id,signal:v?v.signal:void 0});if(!S.current)return;Z(h)}catch(h){if(U(h)||!S.current)return;m(y=>({...y,phase:"error",error:{code:h.code||"http-error",message:h.message||""}}))}finally{S.current&&L(null)}},[Z,i,t]),Je=(0,g.useCallback)(d=>{if(A===null){if(C!==d.id){D(),E(d.id),q.current=setTimeout(()=>{q.current=null,S.current&&E(null)},3e3);return}D(),E(null),ve(d)}},[C,D,A,ve]),Ve=(0,g.useCallback)(d=>{k(v=>{let h=new Set(v);return h.has(d)?h.delete(d):h.add(d),h})},[]),F=f.terms||[],xe=(0,g.useMemo)(()=>Ae(F,p),[F,p]),oe=!!x&&!x.id,Ye=(0,g.useCallback)(()=>{M()},[M]),Ze=f.phase==="loading"&&F.length===0,Xe=f.phase==="ready"&&!f.error&&!oe&&F.length===0,Qe=f.phase==="ready"&&!f.error&&F.length>0&&xe.length===0;return(0,l.jsxs)("div",{className:"jargon-panel",children:[(0,l.jsxs)("div",{className:"jargon-toolbar",children:[(0,l.jsxs)("div",{className:"jargon-search",children:[(0,l.jsx)(ke,{size:13}),(0,l.jsx)("input",{type:"search",value:p,"aria-label":o("search"),placeholder:o("search"),onChange:d=>w(d.target.value)}),p?(0,l.jsx)("button",{type:"button",className:"jargon-icon-btn","aria-label":o("clearSearch"),onClick:()=>w(""),children:(0,l.jsx)(Se,{size:12})}):null]}),(0,l.jsxs)("button",{type:"button",className:"jargon-btn is-primary",onClick:Ge,disabled:!i||oe,title:o("new"),children:[(0,l.jsx)(Ee,{size:13}),o("new")]})]}),f.error?(0,l.jsxs)("div",{className:"jargon-banner",role:"alert",children:[(0,l.jsx)("div",{className:"jargon-banner-text",children:G(f.error.code,f.error.message,f.file,o)}),f.error.code==="corrupt"&&f.file&&f.error.message?(0,l.jsx)("div",{className:"jargon-banner-meta",children:f.error.message}):null,(0,l.jsx)("div",{className:"jargon-banner-actions",children:(0,l.jsx)("button",{type:"button",className:"jargon-btn",onClick:Ye,children:o("retry")})})]}):null,Ze?(0,l.jsx)("p",{className:"jargon-muted",role:"status",children:o("loading")}):null,(0,l.jsxs)("div",{className:"jargon-scroll",children:[oe?(0,l.jsx)(He,{draft:x,t:o,saving:N,error:B,onDraftChange:ye,onSave:we,onCancel:X,autoFocus:!0}):null,Xe?(0,l.jsxs)("div",{className:"jargon-empty",children:[(0,l.jsx)("span",{className:"jargon-empty-title",children:o("emptyTitle")}),(0,l.jsx)("span",{children:o("emptyHint")})]}):null,Qe?(0,l.jsx)("div",{className:"jargon-empty",children:(0,l.jsx)("span",{className:"jargon-empty-title",children:o("noResults")})}):null,(0,l.jsx)("ul",{className:"jargon-list","aria-label":o("title"),children:xe.map(d=>x&&x.id===d.id?(0,l.jsx)("li",{children:(0,l.jsx)(He,{draft:x,t:o,saving:N,error:B,onDraftChange:ye,onSave:we,onCancel:X,autoFocus:!0})},d.id):(0,l.jsx)(jr,{item:d,t:o,expanded:j.has(d.id),armed:C===d.id,deleting:A===d.id,onEdit:Ke,onDelete:Je,onToggleExpand:Ve},d.id))})]})]})}var fe="dsh-jargon-list-styles",Er=`
    .jargon-panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      min-width: 0;
      height: 100%;
      background: transparent;
      color: var(--dsw-alias-label-primary);
      font-family: var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
      font-size: 13px;
    }

    /* ---------- 工具条：搜索 + 新增 ---------- */
    .jargon-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: none;
      padding: 10px 12px;
      border-bottom: 1px solid var(--dsw-alias-border-l2);
    }
    .jargon-search {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
      height: 28px;
      padding: 0 6px;
      border: 1px solid var(--dsw-alias-border-l2);
      border-radius: var(--dsw-radius-md, 8px);
      background: var(--dsw-alias-bg-base);
      color: var(--dsw-alias-label-tertiary);
    }
    .jargon-search:focus-within { border-color: var(--dsw-alias-brand-primary); }
    .jargon-search input {
      flex: 1;
      min-width: 0;
      height: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--dsw-alias-label-primary);
      font: inherit;
    }
    .jargon-search input::placeholder { color: var(--dsw-alias-label-tertiary); }

    /* ---------- 按钮 ---------- */
    .jargon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 26px;
      padding: 0 9px;
      border: 1px solid transparent;
      border-radius: var(--dsw-radius-sm, 6px);
      background: transparent;
      color: var(--dsw-alias-label-secondary);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .jargon-btn:hover:not(:disabled) {
      background: var(--dsw-alias-interactive-bg-hover);
      color: var(--dsw-alias-label-primary);
    }
    .jargon-btn:disabled { opacity: .45; cursor: default; }
    .jargon-btn.is-primary {
      background: var(--dsw-alias-button-primary-fill);
      color: var(--dsw-alias-label-primary-foreground);
    }
    .jargon-btn.is-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }

    .jargon-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 22px;
      height: 22px;
      padding: 0;
      border: 0;
      border-radius: var(--dsw-radius-sm, 6px);
      background: transparent;
      color: var(--dsw-alias-label-tertiary);
      cursor: pointer;
    }
    .jargon-icon-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }

    /* 行内文字按钮（编辑 / 删除 / 展开） */
    .jargon-link {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--dsw-alias-label-secondary);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .jargon-link:hover { color: var(--dsw-alias-label-primary); }
    .jargon-link.is-danger { color: var(--dsw-alias-label-tertiary); }
    .jargon-link.is-danger:hover { color: var(--dsw-alias-label-error); }
    .jargon-link.is-danger.is-armed {
      color: var(--dsw-alias-label-error);
      background: var(--dsw-alias-interactive-bg-hover-danger);
      border-radius: var(--dsw-radius-sm, 6px);
      padding: 0 4px;
    }

    .jargon-btn:focus-visible,
    .jargon-icon-btn:focus-visible,
    .jargon-link:focus-visible,
    .jargon-row:focus-visible {
      outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
      outline-offset: 1px;
    }

    /* ---------- 错误条 ---------- */
    .jargon-banner {
      flex: none;
      margin: 10px 12px 0;
      padding: 8px 10px;
      border: 1px solid var(--dsw-alias-state-error-primary);
      border-radius: var(--dsw-radius-md, 8px);
      background: var(--dsw-alias-bg-layer-2);
      color: var(--dsw-alias-label-error);
      font-size: 12px;
      line-height: 1.6;
    }
    .jargon-banner-text { overflow-wrap: anywhere; }
    .jargon-banner-meta {
      margin-top: 2px;
      color: var(--dsw-alias-label-tertiary);
      font-size: 11px;
      overflow-wrap: anywhere;
    }
    .jargon-banner-actions { display: flex; gap: 8px; margin-top: 6px; }

    /* ---------- 列表 ---------- */
    .jargon-scroll {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-height: 0;
      padding: 8px 10px 16px;
      overflow-y: auto;
    }
    .jargon-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .jargon-row {
      border: 1px solid var(--dsw-alias-border-l2);
      border-radius: var(--dsw-radius-md, 8px);
      background: var(--dsw-alias-bg-layer-1);
      padding: 8px 10px;
      min-width: 0;
    }
    .jargon-row:hover { border-color: var(--dsw-alias-border-l3); }
    .jargon-row-head {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-width: 0;
    }
    .jargon-term {
      flex: 1;
      min-width: 0;
      font-weight: 600;
      color: var(--dsw-alias-label-primary);
      overflow-wrap: anywhere;
    }
    .jargon-row-actions {
      display: none;
      align-items: center;
      gap: 8px;
      flex: none;
    }
    .jargon-row:hover .jargon-row-actions,
    .jargon-row:focus-within .jargon-row-actions { display: flex; }
    @media (hover: none) {
      .jargon-row-actions { display: flex; }
    }

    .jargon-def {
      margin: 4px 0 0;
      color: var(--dsw-alias-label-secondary);
      line-height: 1.65;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .jargon-def.is-collapsed {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    .jargon-expand {
      margin-top: 2px;
      display: inline-block;
    }
    .jargon-meta {
      margin: 6px 0 0;
      color: var(--dsw-alias-label-tertiary);
      font-size: 11px;
      line-height: 1.5;
    }

    /* ---------- 就地编辑 ---------- */
    .jargon-editor-title {
      color: var(--dsw-alias-label-secondary);
      font-size: 12px;
      font-weight: 600;
    }
    .jargon-editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border: 1px solid var(--dsw-alias-border-l3);
      border-radius: var(--dsw-radius-md, 8px);
      background: var(--dsw-alias-bg-layer-1);
      padding: 10px;
    }
    .jargon-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .jargon-field-label {
      color: var(--dsw-alias-label-tertiary);
      font-size: 11px;
    }
    .jargon-input,
    .jargon-textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--dsw-alias-border-l2);
      border-radius: var(--dsw-radius-sm, 6px);
      background: var(--dsw-alias-bg-base);
      color: var(--dsw-alias-label-primary);
      font: inherit;
      font-size: 13px;
      padding: 5px 7px;
      outline: 0;
    }
    .jargon-input:focus,
    .jargon-textarea:focus { border-color: var(--dsw-alias-brand-primary); }
    .jargon-input::placeholder,
    .jargon-textarea::placeholder { color: var(--dsw-alias-label-tertiary); }
    .jargon-textarea { resize: vertical; min-height: 76px; line-height: 1.6; }
    .jargon-form-error {
      margin: 0;
      color: var(--dsw-alias-label-error);
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .jargon-editor-actions { display: flex; align-items: center; gap: 8px; }
    .jargon-editor-hint {
      margin-left: auto;
      color: var(--dsw-alias-label-tertiary);
      font-size: 11px;
    }

    /* ---------- 空态 / 加载 ---------- */
    .jargon-crash {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 16px;
    }
    .jargon-error-detail {
      color: var(--dsw-alias-state-error-primary);
      font-size: 12px;
      line-height: 18px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .jargon-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex: 1;
      padding: 28px 18px;
      text-align: center;
      color: var(--dsw-alias-label-tertiary);
      line-height: 1.7;
    }
    .jargon-empty-title { color: var(--dsw-alias-label-secondary); font-weight: 600; }
    .jargon-muted {
      margin: 10px 12px;
      color: var(--dsw-alias-label-tertiary);
      font-size: 12px;
    }

    /* ---------- 会话头部入口 ---------- */
    .jargon-header-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 26px;
      height: 26px;
      padding: 0;
      border: 0;
      border-radius: var(--dsw-radius-sm, 6px);
      background: transparent;
      color: var(--dsw-alias-label-secondary);
      cursor: pointer;
    }
    .jargon-header-btn:hover {
      background: var(--dsw-alias-interactive-bg-hover);
      color: var(--dsw-alias-label-primary);
    }
    .jargon-header-btn:focus-visible {
      outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
      outline-offset: -2px;
    }

    /* 对话正文里的黑话词：蓝色 + 细虚线下划线，提示“可悬停” */
    .jargon-hl {
      /* link 词在明暗主题下都是蓝色系；brand 在这个默认主题里是近白色，不能用 */
      color: var(--dsw-alias-link, var(--dsw-alias-brand-primary));
      border-bottom: 1px dashed color-mix(in srgb, currentColor 55%, transparent);
      cursor: help;
    }
    .jargon-hl:hover {
      border-bottom-style: solid;
    }

    /* 悬浮解释卡片：portal 到 body，靠近视口边缘会翻转 */
    .jargon-tip {
      position: fixed;
      z-index: 2147483000;
      max-width: 360px;
      max-height: 42vh;
      overflow: auto;
      padding: 10px 12px;
      border: 1px solid var(--dsw-alias-border-l1);
      border-radius: var(--dsw-radius-md, 8px);
      background: var(--dsw-alias-bg-overlay);
      box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
      font-family: var(--dsw-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
      font-size: 12px;
      line-height: 1.6;
      color: var(--dsw-alias-label-primary);
      pointer-events: none;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .jargon-tip[hidden] {
      display: none;
    }
    .jargon-tip__term {
      margin-bottom: 4px;
      font-weight: 600;
      color: var(--dsw-alias-link, var(--dsw-alias-brand-primary));
    }
    .jargon-tip__def {
      color: var(--dsw-alias-label-secondary);
    }
    `;function Pe(){if(typeof document>"u"||!document.head)return()=>{};if(document.getElementById(fe))return()=>{};let r=document.createElement("style");return r.id=fe,r.textContent=Er,document.head.append(r),()=>{if(typeof document>"u")return;let t=document.getElementById(fe);t&&t.remove()}}var O="jargon-hl",kr="data-jargon-term",Sr='[data-conversation-region="chat"]',Nr="[data-text-interaction-source]",Cr=new Set(["PRE","CODE","KBD","SAMP","VAR","A","TEXTAREA","INPUT","SCRIPT","STYLE","BUTTON","SELECT","OPTION","SVG"]),Lr=".katex, .katex-display, .mermaid, [data-jargon-skip]";function Be(e){return String(e||"").normalize("NFKC").toLowerCase().trim()}function Ir(e){return/^[A-Za-z0-9_.+#-]+$/.test(e)&&/[A-Za-z]/.test(e)}var $e=/[A-Za-z0-9_]/;function Ar(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function re(e){let r=new Map,t=new Set,n=0;for(let c of Array.isArray(e)?e:[]){if(!c||typeof c.term!="string")continue;let i=c.term.trim();if(i==="")continue;let f=typeof c.definition=="string"?c.definition:"",m=Be(i);r.has(m)||r.set(m,{term:i,definition:f}),t.add(i);let p=i.normalize("NFKC");p!==i&&t.add(p),n=Math.max(n,i.length)}if(t.size===0)return{isEmpty:!0,longest:0,terms:r,match:()=>[],definitionFor:()=>{}};let a=[...t].sort((c,i)=>i.length-c.length).map(Ar),o=new RegExp(a.join("|"),"gi");function s(c){return r.get(Be(c))}function u(c){if(typeof c!="string"||c.length===0)return[];let i=[];o.lastIndex=0;let f;for(;(f=o.exec(c))!==null;){let m=f[0],p=f.index,w=p+m.length;if(Ir(m)){let k=p>0?c[p-1]:"",x=w<c.length?c[w]:"";if($e.test(k)||$e.test(x))continue}let j=s(m);j!==void 0&&(i.push({start:p,end:w,term:j.term,definition:j.definition}),o.lastIndex=w)}return i}return{isEmpty:!1,longest:n,terms:r,match:u,definitionFor:s}}function Dr(e){if(!e||e.nodeType!==3)return!1;let r=e.nodeValue;if(typeof r!="string"||r.length===0||!/\S/.test(r))return!1;let t=e.parentElement;if(!t)return!1;try{if(t.closest(`.${O}`)||t.closest(Lr))return!1}catch{return!1}let n=t;for(;n;){if(Cr.has(n.tagName))return!1;n=n.parentElement}return!0}function _r(e,r,t){let n=e.nodeValue,a=r.match(n);if(a.length===0)return 0;let o=e.parentNode;if(!o)return 0;let s=t.createDocumentFragment(),u=0;for(let c of a){c.start>u&&s.appendChild(t.createTextNode(n.slice(u,c.start)));let i=t.createElement("span");i.className=O,i.setAttribute(kr,c.term),i.textContent=n.slice(c.start,c.end),s.appendChild(i),u=c.end}return u<n.length&&s.appendChild(t.createTextNode(n.slice(u))),o.replaceChild(s,e),a.length}function pe(e,r,t){if(!e||!r||r.isEmpty)return 0;let n=t||(typeof document<"u"?document:void 0);if(!n)return 0;let a=0,o;try{o=n.createTreeWalker(e,4)}catch{return 0}let s=[];for(;o.nextNode();)Dr(o.currentNode)&&s.push(o.currentNode);for(let u of s)try{a+=_r(u,r,n)}catch{}return a}function ge(e,r){if(!e)return 0;let t=r||(typeof document<"u"?document:void 0);if(!t||typeof e.querySelectorAll!="function")return 0;let n=[...e.querySelectorAll(`.${O}`)];for(let a of n)try{let o=t.createTextNode(a.textContent||"");a.parentNode.replaceChild(o,a)}catch{}if(n.length>0)try{e.normalize()}catch{}return n.length}function qe(e){try{let r=e.querySelector("[data-conversation-session]"),t=r&&r.getAttribute("data-conversation-session");return typeof t=="string"&&t!==""?t:void 0}catch{return}}function te(e){try{return[...(e.querySelector(Sr)||e).querySelectorAll(Nr)]}catch{return[]}}var ot=`.${O}`;var Rr="jargon-term-tooltip",Mr=120;function Or(e,r){let t=document.createElement("div");t.className="jargon-tip__term",t.textContent=e;let n=document.createElement("div");n.className="jargon-tip__def",n.textContent=r;let a=document.createDocumentFragment();return a.appendChild(t),a.appendChild(n),a}function Fe(e={}){let r=e.doc||(typeof document<"u"?document:void 0),t=e.win||(typeof window<"u"?window:void 0);if(!r||!t||!r.body||typeof e.lookup!="function")return()=>{};let n=r.createElement("div");n.id=Rr,n.className="jargon-tip",n.setAttribute("role","tooltip"),n.hidden=!0,r.body.appendChild(n);let a=0,o=null,s=()=>{a&&(t.clearTimeout(a),a=0),o=null,n.hidden=!0},u=p=>{let j=n.getBoundingClientRect(),k=j.width||280,x=j.height||80,I=p.clientX+14,N=p.clientY+14;I+k+8>t.innerWidth&&(I=Math.max(8,p.clientX-k-14)),N+x+8>t.innerHeight&&(N=Math.max(8,p.clientY-x-14)),n.style.left=`${Math.round(I)}px`,n.style.top=`${Math.round(N)}px`},c=(p,w)=>{let j=e.lookup(p);j&&(o=p,n.textContent="",n.appendChild(Or(j.term,j.definition)),n.hidden=!1,n.style.left="-9999px",n.style.top="-9999px",u(w))},i=p=>{let w=p.target;if(!w||typeof w.closest!="function")return;let j=w.closest(`.${O}`);if(!j){o!==null&&s();return}let k=j.getAttribute("data-jargon-term");if(k){if(k===o&&n.hidden===!1){u(p);return}s(),a=t.setTimeout(()=>c(k,p),Mr)}},f=p=>{o===null||n.hidden||u(p)},m=p=>{let w=p.target;w&&typeof w.closest=="function"&&w.closest(`.${O}`)&&s()};return r.addEventListener("mouseover",i,!0),r.addEventListener("mousemove",f,!0),r.addEventListener("mouseout",m,!0),r.addEventListener("scroll",s,!0),r.addEventListener("click",s,!0),t.addEventListener("blur",s),()=>{s(),r.removeEventListener("mouseover",i,!0),r.removeEventListener("mousemove",f,!0),r.removeEventListener("mouseout",m,!0),r.removeEventListener("scroll",s,!0),r.removeEventListener("click",s,!0),t.removeEventListener("blur",s);try{n.remove()}catch{}}}var Hr=150,zr=5e3;function We(){}function Ue(e,r={}){let t=r.doc||(typeof document<"u"?document:void 0),n=r.win||(typeof window<"u"?window:void 0),a=r.api||z;if(!t||!n||!t.body)return We;let o=re([]),s,u,c,i=!1,f=0,m=0,p=!1,w=Fe({doc:t,win:n,lookup:b=>o.definitionFor(b)});function j(){if(!(i||o.isEmpty))for(let b of te(t))try{pe(b,o,t)}catch{}}function k(){if(!i)for(let b of te(t))try{ge(b,t),o.isEmpty||pe(b,o,t)}catch{}}function x(){i||o.isEmpty||f||(f=n.setTimeout(()=>{f=0,j()},Hr))}async function I(){if(i)return;let b=qe(t),C=b?K(e,b):null,E=C&&C.cwd;if(E===void 0){o.isEmpty||(o=re([]),k()),u=b,s=void 0,c=void 0;return}let A=b!==u||E!==s;u=b,s=E;try{let L=await a.state({cwd:E});if(i||!A&&L.revision===c)return;c=L.revision,o=re(L.terms),k()}catch{}}function N(){i||p||t.hidden||(p=!0,I().catch(We).finally(()=>{p=!1}))}let _;try{_=new n.MutationObserver(b=>{if(i||o.isEmpty)return;let C=!1;for(let E of b){let A=E.target;if(!(A&&typeof A.closest=="function"&&A.closest(".jargon-hl"))){if(E.type==="characterData"){C=!0;break}for(let L of E.addedNodes){if(L.nodeType===3){C=!0;break}if(L.nodeType===1){if(L.classList&&L.classList.contains("jargon-hl"))continue;C=!0;break}}if(C)break}}C&&x()}),_.observe(t.body,{childList:!0,subtree:!0,characterData:!0})}catch{_=void 0}let B=()=>{t.hidden||N()};return t.addEventListener("visibilitychange",B),N(),m=n.setInterval(N,zr),()=>{i=!0,f&&n.clearTimeout(f),m&&n.clearInterval(m),f=0,m=0;try{_&&_.disconnect()}catch{}t.removeEventListener("visibilitychange",B);try{w()}catch{}for(let b of te(t))try{ge(b,t)}catch{}}}var J=require("react/jsx-runtime"),he="@tom2012/dsh-jargon-list",ne="jargon",me="jargonList",Pr="jargon-open",Br=["slots"];function $r(e,r){try{if(e&&typeof e.get=="function"){let t=e.get(r);if(t!==void 0)return t}}catch{}try{return e?e[r]:void 0}catch{return}}function qr(e){let{ctx:r,sessionId:t}=e,n=W(r),a=typeof e.t=="function"?e.t:n;if(!t)return null;let o=()=>{let s=$r(r,"sidebarRight");if(s){try{if(typeof s.openTab=="function"){s.openTab(ne);return}}catch{}try{typeof s.openTabIn=="function"&&s.openTabIn(t,ne)}catch{}}};return(0,J.jsx)("button",{type:"button",className:"jargon-header-btn",title:a("open"),"aria-label":a("open"),onClick:o,children:(0,J.jsx)(Te,{size:16})})}function Fr(e){let r=(t,n)=>se(e)(t,n);e.effect(()=>Pe(),"jargon-list: styles"),e.effect(()=>{try{return Ue(e)}catch{return()=>{}}},"jargon-list: inline highlight"),e.inject(["locale"],t=>{t.effect(()=>Ie(t),"jargon-list: copy")}),e.inject(["slots","sidebarRightTabs"],t=>{let n=t.sidebarRightTabs,a=t.slots;!n||typeof n.register!="function"||!a||typeof a.inject!="function"||(t.effect(()=>n.register({id:he,kind:ne,priority:"extension",title:()=>r("title"),guide:[{id:"open",order:45,title:()=>r("title"),description:()=>r("guideDescription"),icon:je}]}),"jargon-list: right tab type"),t.effect(()=>a.inject("sidebar.right.pane.tab",()=>a.register({name:"sidebar.right.pane.tab",key:he,locale:me,inject:o=>({sessionId:o})},o=>(0,J.jsx)(ze,{ctx:e,...o}))),"jargon-list: right tab body"))}),e.inject(["slots"],t=>{let n=t.slots;!n||typeof n.inject!="function"||t.effect(()=>n.inject("conversation.session.header.utilities",()=>n.register({name:"conversation.session.header.utilities",id:Pr,order:-20,locale:me},a=>(0,J.jsx)(qr,{ctx:e,...a}))),"jargon-list: session header entry")})}

    return module.exports
  }
})
