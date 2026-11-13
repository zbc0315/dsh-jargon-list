/* 由 tools/build.mjs 从 src/client/index.js 生成 —— 请勿手改；重新生成：npm run build */
window.__ModuleLoader__.load({
  id: "@tom2012/dsh-jargon-list",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    var Z=Object.defineProperty;var Je=Object.getOwnPropertyDescriptor;var Ue=Object.getOwnPropertyNames;var $e=Object.prototype.hasOwnProperty;var Ke=(e,r)=>{for(var n in r)Z(e,n,{get:r[n],enumerable:!0})},Ve=(e,r,n,t)=>{if(r&&typeof r=="object"||typeof r=="function")for(let o of Ue(r))!$e.call(e,o)&&o!==n&&Z(e,o,{get:()=>r[o],enumerable:!(t=Je(r,o))||t.enumerable});return e};var Ze=e=>Ve(Z({},"__esModule",{value:!0}),e);var wr={};Ke(wr,{LOCALE_NS:()=>ae,TAB_ID:()=>oe,TAB_KIND:()=>U,apply:()=>yr,inject:()=>hr});module.exports=Ze(wr);var Rr=require("react");var b=require("react/jsx-runtime"),k={fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round"};function he({size:e=20}){return(0,b.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:[(0,b.jsx)("path",{d:"M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13Z",...k}),(0,b.jsx)("path",{d:"M8.5 9h7M8.5 12.5h7M8.5 16h4",...k})]})}function me({size:e=16}){return(0,b.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:[(0,b.jsx)("path",{d:"M5.5 6A1.5 1.5 0 0 1 7 4.5h10A1.5 1.5 0 0 1 18.5 6v12.5A1.5 1.5 0 0 1 17 20H7a1.5 1.5 0 0 1-1.5-1.5V6Z",...k}),(0,b.jsx)("path",{d:"M9 9.5h6M9 13h6M9 16.5h3.5",...k})]})}function be({size:e=13}){return(0,b.jsx)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:(0,b.jsx)("path",{d:"M12 5.5v13M5.5 12h13",...k})})}function ye({size:e=13}){return(0,b.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:[(0,b.jsx)("circle",{cx:"11",cy:"11",r:"5.75",...k}),(0,b.jsx)("path",{d:"M15.4 15.4 19 19",...k})]})}function we({size:e=12}){return(0,b.jsx)("svg",{viewBox:"0 0 24 24",width:e,height:e,"aria-hidden":"true",focusable:"false",fill:"none",children:(0,b.jsx)("path",{d:"M6 6l12 12M18 6 6 18",...k})})}var S=require("react"),ve="jargonList",xe={title:"黑话单",guideDescription:"本项目里 agent 起的简称与它们的详细含义",open:"打开黑话单",search:"搜索黑话或说明",new:"新增",save:"保存",cancel:"取消",edit:"编辑",delete:"删除",confirmDelete:"再点一次删除",expand:"展开",collapse:"收起",emptyTitle:"还没有黑话",emptyHint:"点右上角「新增」，或让 agent 用 jargon_save 记一条。",loading:"加载中…",retry:"重试",termLabel:"黑话",definitionLabel:"详细说明",termPlaceholder:"例如：三件套",definitionPlaceholder:"它具体指什么：步骤、范围、产出……",errorNoSession:"当前会话不在运行，黑话单不可用。",errorNoWorkspace:"当前会话没有工作目录。",errorCorrupt:"黑话数据文件损坏，已停止写入：{file}",errorInvalidTerm:"黑话不能为空，且不超过 80 字。",errorDuplicateTerm:"已存在同名黑话。",errorDefinitionTooLong:"详细说明不能超过 4000 字。",errorNotFound:"这条黑话已经被删除。",errorNetwork:"连不上黑话服务，请确认 dsh web 正在运行后重试。",errorUnknown:"出错了。",newTermTitle:"新增黑话",editTermTitle:"编辑黑话",editorHint:"⌘/Ctrl+Enter 保存 · Esc 取消",saving:"保存中…",noResults:"没有匹配的黑话",clearSearch:"清空搜索",byAgent:"agent",byUser:"我",metaBy:"{who} 记于 {time}"},je={title:"Jargon List",guideDescription:"Short names coined in this project and what they mean",open:"Open Jargon List",search:"Search terms or meanings",new:"New",save:"Save",cancel:"Cancel",edit:"Edit",delete:"Delete",confirmDelete:"Click again to delete",expand:"Expand",collapse:"Collapse",emptyTitle:"No jargon yet",emptyHint:"Use New above, or let the agent record one with jargon_save.",loading:"Loading…",retry:"Retry",termLabel:"Term",definitionLabel:"Meaning",termPlaceholder:"e.g. the triple check",definitionPlaceholder:"What it actually means: steps, scope, output…",errorNoSession:"This session is not running, so the Jargon List is unavailable.",errorNoWorkspace:"This session has no working directory.",errorCorrupt:"The jargon data file is corrupt; writing is disabled: {file}",errorInvalidTerm:"A term is required and must be at most 80 characters.",errorDuplicateTerm:"A term with this name already exists.",errorDefinitionTooLong:"The meaning must be at most 4000 characters.",errorNotFound:"That term was already deleted.",errorNetwork:"Cannot reach the jargon service. Make sure dsh web is running, then retry.",errorUnknown:"Something went wrong.",newTermTitle:"New term",editTermTitle:"Edit term",editorHint:"⌘/Ctrl+Enter saves · Esc cancels",saving:"Saving…",noResults:"Nothing matched",clearSearch:"Clear search",byAgent:"agent",byUser:"me",metaBy:"recorded by {who} · {time}"},Ye={zh:xe,en:je};function Y(e,r){try{if(e&&typeof e.get=="function"){let n=e.get(r);if(n!==void 0)return n}}catch{}try{return e?e[r]:void 0}catch{return}}function Ge(){try{let e=typeof document<"u"&&document.documentElement.lang||"zh-CN";return String(e).toLowerCase().startsWith("zh")?"zh":"en"}catch{return"zh"}}function Qe(e,r){return typeof e!="string"?"":r?e.replace(/\{(\w+)\}/g,(n,t)=>t in r?String(r[t]):n):e}function Xe(e){let r=(e||Ge())==="en"?je:xe;return(n,t)=>{let o=Object.prototype.hasOwnProperty.call(r,n)?r[n]:n;return Qe(o,t)}}function ke(e){let r=Y(e,"locale");return!r||typeof r.register!="function"?()=>{}:r.register(ve,Ye)}function G(e){let r=Y(e,"locale");try{if(r&&typeof r.bind=="function")return r.bind(ve)}catch{}return Xe()}function I(e){let[r,n]=(0,S.useState)(0);return(0,S.useEffect)(()=>{let t=Y(e,"locale"),o;try{t&&typeof t.subscribe=="function"&&(o=t.subscribe(()=>n(a=>a+1)))}catch{o=void 0}return()=>{if(typeof o=="function")try{o()}catch{}}},[e]),(0,S.useMemo)(()=>G(e),[e,r])}var l=require("react");var er="/-/jargon",rr="network",W=class extends Error{constructor(r,n,t){super(n||r||"request failed"),this.name="ApiError",this.code=r||"unknown",this.status=t}};function nr(e){return e===404?"jargon route not found (host plugin may not be mounted)":e===403||e===401?"the host rejected the request (not authorized)":e===409?"the jargon file changed in a conflicting way":e===413?"request body too large":e===503?"the host service is unavailable; restart dsh web":e>=500?"host internal error":`HTTP ${e}`}function tr(e){return e===401?"unauthorized":e===403?"forbidden":e===404?"not-found":e===413?"too-large":e===503?"unavailable":"http-error"}function or(e){let r=[];for(let[n,t]of Object.entries(e||{}))t==null||t===""||r.push(`${encodeURIComponent(n)}=${encodeURIComponent(String(t))}`);return r.length?`?${r.join("&")}`:""}async function ar(e){let r=null;try{r=await e.json()}catch{r=null}let n=r&&r.ok===!1?r.error:null;if(!e.ok||n){let t=n&&n.code?n.code:tr(e.status),o=n&&n.message?n.message:nr(e.status);throw new W(t,o,e.status)}return r||{}}function R(e){return!!e&&(e.name==="AbortError"||e.code===20)}function ir({fetch:e,base:r=er}={}){let n=typeof e=="function"?e:(...a)=>globalThis.fetch(...a),t=a=>`${r}${a}`;async function o(a,c){let h;try{h=await n(t(a),{credentials:"same-origin",...c})}catch(m){if(R(m))throw m;let d=m&&m.message?m.message:"network error";throw new W(rr,d,0)}return ar(h)}return{base:r,state({session:a,cwd:c,signal:h}={}){return o(`/state${or({session:a,cwd:c})}`,{signal:h,method:"GET"})},mutate({session:a,cwd:c,action:h,id:m,term:d,definition:f,signal:v}={}){let x={session:a,cwd:c,action:h};return m!==void 0&&(x.id=m),d!==void 0&&(x.term=d),f!==void 0&&(x.definition=f),o("/mutate",{method:"POST",signal:v,headers:{"Content-Type":"application/json"},body:JSON.stringify(x)})}}}var F=ir();function Ne(e,r){let n=Array.isArray(e)?e:[],t=String(r??"").trim().toLowerCase();return t===""?n:n.filter(o=>{if(!o)return!1;let a=String(o.term===void 0||o.term===null?"":o.term).toLowerCase(),c=String(o.definition===void 0||o.definition===null?"":o.definition).toLowerCase();return a.includes(t)||c.includes(t)})}function Te(e){let r=String(e??"");return r===""?!1:r.length>120?!0:r.split(/\r\n|\r|\n/).length>3}function M(e,r,n,t){let o=typeof t=="function"?t:a=>a;switch(e){case"no-session":return o("errorNoSession");case"no-workspace":return o("errorNoWorkspace");case"corrupt":return o("errorCorrupt",{file:n||r||""});case"invalid-term":return o("errorInvalidTerm");case"duplicate-term":return o("errorDuplicateTerm");case"definition-too-long":return o("errorDefinitionTooLong");case"not-found":return o("errorNotFound");case"network":return o("errorNetwork");default:return r||o("errorUnknown")}}function Q({current:e,response:r}={}){return!e||!r||e.session!==r.session?!0:typeof r.seq=="number"&&typeof e.seq=="number"?r.seq<e.seq:!1}function Se(e){if(!e)return"";let r=e instanceof Date?e:new Date(e);if(Number.isNaN(r.getTime()))return"";let n=t=>String(t).padStart(2,"0");return`${n(r.getMonth()+1)}-${n(r.getDate())} ${n(r.getHours())}:${n(r.getMinutes())}`}function Ce(e,r){let n=typeof r=="function"?r:t=>t;return n(e==="agent"?"byAgent":"byUser")}var J=require("react");function ee(e,r){try{if(e&&typeof e.get=="function")return e.get(r)}catch{}}function sr(e,r){try{let t=ee(e,"workspaces"),o=t&&t.list&&t.list.getSnapshot(),c=(o&&o.items||[]).find(h=>h&&h.path===r);if(c){let h=c.title||c.displayTitle||c.name;if(h)return h}}catch{}let n=String(r).split(/[\\/]/).filter(Boolean);return n.length?n[n.length-1]:String(r)}function X(e,r){if(!r)return null;try{let n=ee(e,"sessions"),t=n&&n.list&&n.list.getSnapshot(),o=t&&t.byId&&t.byId[r],a=o&&o.cwd;return typeof a!="string"||a===""?null:{cwd:a,title:sr(e,a)}}catch{return null}}function Ee(e,r){let[n,t]=(0,J.useState)(()=>X(e,r));return(0,J.useEffect)(()=>{t(X(e,r));let o=ee(e,"sessions"),a=o&&o.list;if(!a||typeof a.subscribe!="function")return;let c;try{c=a.subscribe(()=>t(X(e,r)))}catch{c=void 0}return()=>{if(typeof c=="function")try{c()}catch{}}},[e,r]),n}var i=require("react/jsx-runtime");var dr={phase:"idle",terms:[],revision:null,file:null,error:null};function C(e){let r=e.current;if(e.current=null,!!r)try{r.abort()}catch{}}function re(){try{return typeof document>"u"||document.visibilityState!=="hidden"}catch{return!0}}function Le(e,r){return{phase:"ready",terms:Array.isArray(e.terms)?e.terms:[],revision:e.revision||null,file:e.file||r&&r.file||null,error:null}}function De({draft:e,t:r,saving:n,error:t,onDraftChange:o,onSave:a,onCancel:c,autoFocus:h}){return(0,i.jsxs)("form",{className:"jargon-editor",onSubmit:d=>{d.preventDefault(),a()},onKeyDown:d=>{if(d.key==="Escape"){d.preventDefault(),d.stopPropagation(),c();return}d.key==="Enter"&&(d.metaKey||d.ctrlKey)&&(d.preventDefault(),a())},children:[(0,i.jsx)("div",{className:"jargon-editor-title",children:e.id?r("editTermTitle"):r("newTermTitle")}),(0,i.jsxs)("label",{className:"jargon-field",children:[(0,i.jsx)("span",{className:"jargon-field-label",children:r("termLabel")}),(0,i.jsx)("input",{className:"jargon-input",type:"text",value:e.term,maxLength:120,autoFocus:h,placeholder:r("termPlaceholder"),onChange:d=>o({term:d.target.value})})]}),(0,i.jsxs)("label",{className:"jargon-field",children:[(0,i.jsx)("span",{className:"jargon-field-label",children:r("definitionLabel")}),(0,i.jsx)("textarea",{className:"jargon-textarea",value:e.definition,rows:5,placeholder:r("definitionPlaceholder"),onChange:d=>o({definition:d.target.value})})]}),t?(0,i.jsx)("p",{className:"jargon-form-error",role:"alert",children:t}):null,(0,i.jsxs)("div",{className:"jargon-editor-actions",children:[(0,i.jsx)("button",{type:"submit",className:"jargon-btn is-primary",disabled:n,children:r(n?"saving":"save")}),(0,i.jsx)("button",{type:"button",className:"jargon-btn",onClick:c,disabled:n,children:r("cancel")}),(0,i.jsx)("span",{className:"jargon-editor-hint",children:r("editorHint")})]})]})}function ur({item:e,t:r,expanded:n,armed:t,deleting:o,onEdit:a,onDelete:c,onToggleExpand:h}){let m=Te(e.definition);return(0,i.jsxs)("li",{className:"jargon-row",children:[(0,i.jsxs)("div",{className:"jargon-row-head",children:[(0,i.jsx)("span",{className:"jargon-term",children:e.term}),(0,i.jsxs)("span",{className:"jargon-row-actions",children:[(0,i.jsx)("button",{type:"button",className:"jargon-link",onClick:()=>a(e),children:r("edit")}),(0,i.jsx)("button",{type:"button",className:t?"jargon-link is-danger is-armed":"jargon-link is-danger",onClick:()=>c(e),disabled:o,"aria-label":r(t?"confirmDelete":"delete"),children:r(o?"delete":t?"confirmDelete":"delete")})]})]}),(0,i.jsx)("p",{className:m&&!n?"jargon-def is-collapsed":"jargon-def",children:e.definition}),m?(0,i.jsx)("button",{type:"button",className:"jargon-link jargon-expand",onClick:()=>h(e.id),children:r(n?"collapse":"expand")}):null,(0,i.jsx)("p",{className:"jargon-meta",children:r("metaBy",{who:Ce(e.updatedBy,r),time:Se(e.updatedAt)})})]})}var ne=class extends l.Component{constructor(r){super(r),this.state={error:null},this.retry=()=>this.setState({error:null})}static getDerivedStateFromError(r){return{error:r}}componentDidCatch(r){try{console.error("[jargon-list] panel crashed",r)}catch{}}render(){if(this.state.error){let r=this.state.error&&this.state.error.message||String(this.state.error);return(0,i.jsxs)("div",{className:"jargon-panel jargon-crash",children:[(0,i.jsx)("div",{className:"jargon-empty-title",children:this.props.label}),(0,i.jsx)("div",{className:"jargon-error-detail",children:r}),(0,i.jsx)("button",{type:"button",className:"jargon-btn",onClick:this.retry,children:this.props.retryLabel})]})}return this.props.children}};function Ae(e){let{ctx:r}=e,n=I(r);return(0,i.jsx)(ne,{label:n("errorUnknown"),retryLabel:n("retry"),children:(0,i.jsx)(pr,{...e})})}function pr(e){let{ctx:r,sessionId:n,useTabInfo:t}=e,o=I(r),a=typeof e.t=="function"?e.t:o,c=typeof t=="function"?t():null,h=!c||!c.tab||c.tab.visible!==!1,m=Ee(r,n),d=m?m.cwd:null,[f,v]=(0,l.useState)(dr),[x,ie]=(0,l.useState)(""),[Re,Me]=(0,l.useState)(()=>new Set),[w,P]=(0,l.useState)(null),[B,se]=(0,l.useState)(!1),[le,N]=(0,l.useState)(null),[$,E]=(0,l.useState)(null),[K,ce]=(0,l.useState)(null),y=(0,l.useRef)(!0),de=(0,l.useRef)(0),_=(0,l.useRef)({seq:0,session:n}),O=(0,l.useRef)(null),L=(0,l.useRef)(null),D=(0,l.useRef)(null),j=(0,l.useCallback)(()=>{D.current!==null&&(clearTimeout(D.current),D.current=null)},[]);(0,l.useEffect)(()=>(y.current=!0,()=>{y.current=!1,j(),C(O),C(L)}),[j]);let T=(0,l.useCallback)(async({silent:s=!1}={})=>{if(!n)return;let g={seq:de.current+=1,session:n};_.current=g,C(O);let u=typeof AbortController=="function"?new AbortController:null;if(O.current=u,!d){if(!y.current)return;v(p=>({...p,phase:"error",error:{code:"no-workspace",message:""}}));return}!s&&y.current&&v(p=>p.phase==="ready"?{...p,phase:"refreshing"}:{...p,phase:"loading"});try{let p=await F.state({session:n,cwd:d,signal:u?u.signal:void 0});if(!y.current||Q({current:_.current,response:g}))return;v(Le(p,null))}catch(p){if(R(p)||!y.current||Q({current:_.current,response:g}))return;v(Fe=>({...Fe,phase:"error",error:{code:p.code||"http-error",message:p.message||""}}))}},[n,d]);(0,l.useEffect)(()=>{T()},[T]),(0,l.useEffect)(()=>{if(!h)return;let s=null,g=()=>{s!==null&&(clearInterval(s),s=null)},u=()=>{s===null&&(s=setInterval(()=>{re()&&T({silent:!0})},2e3))},p=()=>{re()?(T({silent:!0}),u()):g()};return re()&&u(),typeof document<"u"&&document.addEventListener("visibilitychange",p),()=>{g(),typeof document<"u"&&document.removeEventListener("visibilitychange",p)}},[h,T]);let H=(0,l.useCallback)(s=>{C(O);let g={seq:de.current+=1,session:n};_.current=g,v(u=>Le(s,u))},[n]),q=(0,l.useCallback)(()=>{P(null),N(null)},[]),ze=(0,l.useCallback)(()=>{j(),E(null),N(null),P({id:null,term:"",definition:""})},[j]),Pe=(0,l.useCallback)(s=>{j(),E(null),N(null),P({id:s.id,term:s.term,definition:s.definition})},[j]),ue=(0,l.useCallback)(s=>{P(g=>g&&{...g,...s})},[]),pe=(0,l.useCallback)(async()=>{if(!w||B)return;if(!d){N(M("no-workspace","",f.file,a));return}let s=String(w.term||"").trim(),g=String(w.definition||"").trim();if(s===""){N(M("invalid-term","",f.file,a));return}se(!0),N(null),C(L);let u=typeof AbortController=="function"?new AbortController:null;L.current=u;try{let p=await F.mutate({session:n,cwd:d,action:"save",...w.id?{id:w.id}:{},term:s,definition:g,signal:u?u.signal:void 0});if(!y.current)return;H(p),q()}catch(p){if(R(p)||!y.current)return;N(M(p.code,p.message,f.file,a))}finally{y.current&&se(!1)}},[H,q,d,f.file,w,B,n,a]),fe=(0,l.useCallback)(async s=>{if(!d){v(u=>({...u,phase:"error",error:{code:"no-workspace",message:""}}));return}ce(s.id),C(L);let g=typeof AbortController=="function"?new AbortController:null;L.current=g;try{let u=await F.mutate({session:n,cwd:d,action:"delete",id:s.id,signal:g?g.signal:void 0});if(!y.current)return;H(u)}catch(u){if(R(u)||!y.current)return;v(p=>({...p,phase:"error",error:{code:u.code||"http-error",message:u.message||""}}))}finally{y.current&&ce(null)}},[H,d,n]),Be=(0,l.useCallback)(s=>{if(K===null){if($!==s.id){j(),E(s.id),D.current=setTimeout(()=>{D.current=null,y.current&&E(null)},3e3);return}j(),E(null),fe(s)}},[$,j,K,fe]),_e=(0,l.useCallback)(s=>{Me(g=>{let u=new Set(g);return u.has(s)?u.delete(s):u.add(s),u})},[]),A=f.terms||[],ge=(0,l.useMemo)(()=>Ne(A,x),[A,x]),V=!!w&&!w.id,Oe=(0,l.useCallback)(()=>{T()},[T]),He=f.phase==="loading"&&A.length===0,qe=f.phase==="ready"&&!f.error&&!V&&A.length===0,We=f.phase==="ready"&&!f.error&&A.length>0&&ge.length===0;return(0,i.jsxs)("div",{className:"jargon-panel",children:[(0,i.jsxs)("div",{className:"jargon-toolbar",children:[(0,i.jsxs)("div",{className:"jargon-search",children:[(0,i.jsx)(ye,{size:13}),(0,i.jsx)("input",{type:"search",value:x,"aria-label":a("search"),placeholder:a("search"),onChange:s=>ie(s.target.value)}),x?(0,i.jsx)("button",{type:"button",className:"jargon-icon-btn","aria-label":a("clearSearch"),onClick:()=>ie(""),children:(0,i.jsx)(we,{size:12})}):null]}),(0,i.jsxs)("button",{type:"button",className:"jargon-btn is-primary",onClick:ze,disabled:!d||V,title:a("new"),children:[(0,i.jsx)(be,{size:13}),a("new")]})]}),f.error?(0,i.jsxs)("div",{className:"jargon-banner",role:"alert",children:[(0,i.jsx)("div",{className:"jargon-banner-text",children:M(f.error.code,f.error.message,f.file,a)}),f.error.code==="corrupt"&&f.file&&f.error.message?(0,i.jsx)("div",{className:"jargon-banner-meta",children:f.error.message}):null,(0,i.jsx)("div",{className:"jargon-banner-actions",children:(0,i.jsx)("button",{type:"button",className:"jargon-btn",onClick:Oe,children:a("retry")})})]}):null,He?(0,i.jsx)("p",{className:"jargon-muted",role:"status",children:a("loading")}):null,(0,i.jsxs)("div",{className:"jargon-scroll",children:[V?(0,i.jsx)(De,{draft:w,t:a,saving:B,error:le,onDraftChange:ue,onSave:pe,onCancel:q,autoFocus:!0}):null,qe?(0,i.jsxs)("div",{className:"jargon-empty",children:[(0,i.jsx)("span",{className:"jargon-empty-title",children:a("emptyTitle")}),(0,i.jsx)("span",{children:a("emptyHint")})]}):null,We?(0,i.jsx)("div",{className:"jargon-empty",children:(0,i.jsx)("span",{className:"jargon-empty-title",children:a("noResults")})}):null,(0,i.jsx)("ul",{className:"jargon-list","aria-label":a("title"),children:ge.map(s=>w&&w.id===s.id?(0,i.jsx)("li",{children:(0,i.jsx)(De,{draft:w,t:a,saving:B,error:le,onDraftChange:ue,onSave:pe,onCancel:q,autoFocus:!0})},s.id):(0,i.jsx)(ur,{item:s,t:a,expanded:Re.has(s.id),armed:$===s.id,deleting:K===s.id,onEdit:Pe,onDelete:Be,onToggleExpand:_e},s.id))})]})]})}var te="dsh-jargon-list-styles",fr=`
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
    `;function Ie(){if(typeof document>"u"||!document.head)return()=>{};if(document.getElementById(te))return()=>{};let r=document.createElement("style");return r.id=te,r.textContent=fr,document.head.append(r),()=>{if(typeof document>"u")return;let n=document.getElementById(te);n&&n.remove()}}var z=require("react/jsx-runtime"),oe="@tom2012/dsh-jargon-list",U="jargon",ae="jargonList",gr="jargon-open",hr=["slots"];function mr(e,r){try{if(e&&typeof e.get=="function"){let n=e.get(r);if(n!==void 0)return n}}catch{}try{return e?e[r]:void 0}catch{return}}function br(e){let{ctx:r,sessionId:n}=e,t=I(r),o=typeof e.t=="function"?e.t:t;if(!n)return null;let a=()=>{let c=mr(r,"sidebarRight");if(c){try{if(typeof c.openTab=="function"){c.openTab(U);return}}catch{}try{typeof c.openTabIn=="function"&&c.openTabIn(n,U)}catch{}}};return(0,z.jsx)("button",{type:"button",className:"jargon-header-btn",title:o("open"),"aria-label":o("open"),onClick:a,children:(0,z.jsx)(me,{size:16})})}function yr(e){let r=(n,t)=>G(e)(n,t);e.effect(()=>Ie(),"jargon-list: styles"),e.inject(["locale"],n=>{n.effect(()=>ke(n),"jargon-list: copy")}),e.inject(["slots","sidebarRightTabs"],n=>{let t=n.sidebarRightTabs,o=n.slots;!t||typeof t.register!="function"||!o||typeof o.inject!="function"||(n.effect(()=>t.register({id:oe,kind:U,priority:"extension",title:()=>r("title"),guide:[{id:"open",order:45,title:()=>r("title"),description:()=>r("guideDescription"),icon:he}]}),"jargon-list: right tab type"),n.effect(()=>o.inject("sidebar.right.pane.tab",()=>o.register({name:"sidebar.right.pane.tab",key:oe,locale:ae,inject:a=>({sessionId:a})},a=>(0,z.jsx)(Ae,{ctx:e,...a}))),"jargon-list: right tab body"))}),e.inject(["slots"],n=>{let t=n.slots;!t||typeof t.inject!="function"||n.effect(()=>t.inject("conversation.session.header.utilities",()=>t.register({name:"conversation.session.header.utilities",id:gr,order:-20,locale:ae},o=>(0,z.jsx)(br,{ctx:e,...o}))),"jargon-list: session header entry")})}

    return module.exports
  }
})
