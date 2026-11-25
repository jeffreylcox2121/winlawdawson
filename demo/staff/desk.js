"use strict";
const cases=[
{id:"JLC-104",client:"Iris Example",clientId:"1004",phone:"(470) 555-0134",title:"Case review",status:"Open",next:"Dec 8, 2026",notes:[{author:"Emily (demo)",date:"2026-11-24T15:15:00Z",text:"Client called to confirm the next appointment. Asked us to check whether the paperwork arrived."},{author:"Jeff (demo)",date:"2026-11-21T16:30:00Z",text:"Reviewed the intake material. Follow up after the appointment."}],docs:[{name:"Appointment confirmation.pdf",author:"Emily (demo)",date:"2026-11-24T16:00:00Z"},{name:"Intake checklist.pdf",author:"Emily (demo)",date:"2026-11-21T14:00:00Z"}]},
{id:"JLC-098",client:"Iris Example",clientId:"1004",phone:"(470) 555-0134",title:"Prior matter",status:"Closed",next:"",notes:[{author:"Jeff (demo)",date:"2026-11-06T13:00:00Z",text:"Closed this matter after the final meeting."}],docs:[]},
{id:"JLC-107",client:"Rowan Sample",clientId:"1007",phone:"(470) 555-0182",title:"New intake",status:"Open",next:"",notes:[],docs:[]}
];
const $=id=>document.getElementById(id);
const searchHint="Search by name, phone, email, client ID, or case number";
const clientContacts={
  "1004":{email:"iris@example.invalid",address:"10 Example Lane, Dawsonville, GA 30534",preferred:"Phone"},
  "1007":{email:"rowan@example.invalid",address:"25 Sample Way, Dawsonville, GA 30534",preferred:"Email"}
};
const caseDetails={
  "JLC-104":{
    court:"Example County Superior Court",
    jurisdiction:"Georgia",
    judge:"Judge Taylor (demo)",
    parties:[{
      name:"State of Georgia",type:"State / government",role:"Prosecution",office:"Example County District Attorney’s Office",
      attorneys:[
        {name:"Morgan Sample",role:"Lead prosecutor",office:"Example County District Attorney’s Office",phone:"(470) 555-0120",email:"morgan.prosecutor@example.invalid"},
        {name:"Jordan Example",role:"Assistant district attorney",office:"Example County District Attorney’s Office",phone:"(470) 555-0121",email:"jordan.prosecutor@example.invalid"}
      ]
    }]
  },
  "JLC-098":{
    court:"Example County State Court",
    jurisdiction:"Georgia",
    parties:[{
      name:"Cedar Example LLC",type:"Private party",role:"Opposing party",phone:"(470) 555-0160",email:"office@example.invalid",
      attorneys:[{name:"Casey Example",role:"Opposing counsel",office:"Example Law Group",phone:"(470) 555-0170",email:"casey.counsel@example.invalid"}]
    }]
  },
  "JLC-107":{parties:[]}
};
let active;
let mode="home";
let submittedQuery="";
let pendingDocument;
let recent=[];
const demoIds=new Set(cases.map(item=>item.id));
try{
  const saved=JSON.parse(localStorage.getItem("jlc-demo-recent")??"[]");
  if(Array.isArray(saved))recent=[...new Set(saved.filter(id=>demoIds.has(id)))].slice(0,8);
}catch{}
let nextClientId=1008;
const current=()=>cases.find(item=>item.id===active);
const dateFormat=new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/New_York"});
const digits=s=>s.replace(/[^0-9]/g,"").replace(/^1(?=\d{10}$)/,"");
function node(tag,text,style){const o=document.createElement(tag);if(text!==undefined)o.textContent=text;if(style)o.className=style;return o;}
function button(text,action,style){const b=node("button",text,style);b.type="button";b.addEventListener("click",action);return b;}
function matches(item,query){
  const email=clientContacts[item.clientId]?.email??"";
  const text=[item.caseNumber??item.id,item.client,item.clientId,email].some(value=>value.toLowerCase().includes(query));
  return text || (/^[-+(). 0-9]+$/.test(query)&&digits(query).length>=4&&digits(item.phone).includes(digits(query)));
}
function openCase(id){
  active=id;
  const item=current();
  mode="home";
  $("search").value="";
  $("search-panel").hidden=false;
  $("search-label").textContent=searchHint;
  if(item&&(item.caseNumber??item.id)){
    recent=[id,...recent.filter(value=>value!==id)].slice(0,8);
    try{localStorage.setItem("jlc-demo-recent",JSON.stringify(recent.filter(value=>demoIds.has(value))));}catch{}
  }
  render();
  if(pendingDocument){
    const kind=pendingDocument;
    pendingDocument=undefined;
    showDocument(kind);
  }
}
function startSearch(kind){
  pendingDocument=kind;
  mode="search";
  active=undefined;
  $("search-label").textContent=kind?"Find the client or case for this "+kind:searchHint;
  $("search-panel").hidden=false;
  $("search").value="";
  submittedQuery="";
  render();
  $("search").focus();
}
function showDocument(kind){
  const item=current();
  if(!item){startSearch(kind);return;}
  $("send-title").textContent=kind==="letter"?"Send Letter":"Send Invoice";
  $("send-client").textContent=item.client+((item.caseNumber??item.id)?" · "+(item.caseNumber??item.id):"");
  $("send-preview-message").textContent=kind==="letter"?"The live app will prepare an editable Word draft for review. Sending is unavailable in this preview.":"The live app will prepare an editable Excel invoice for review. Sending is unavailable in this preview.";
  const message=$("send-preview-message");
  message.textContent="Sample draft. No message was sent.";
  const existing=$("draft-sample");
  if(existing)existing.remove();
  const draft=node("pre",undefined,"draft-sample");
  draft.id="draft-sample";
  const contact=clientContacts[item.clientId]??{};
  const caseNumber=item.caseNumber??item.id;
  const address=[item.client,contact.address].filter(Boolean).join("\n");
  draft.textContent=kind==="letter"
    ?"Jeffrey L Cox, Attorney at Law\n\n"+address+"\n\nRe: "+(caseNumber||"General correspondence")+"\n\nDear "+item.client+",\n\n[Write your letter here.]"
    :"JLC Invoice\n\nBill to\n"+address+"\n\nCase "+(caseNumber||"Pending")+"\n\n[Enter services, rates, and charges.]";
  message.after(draft);
  $("send-dialog").showModal();
}
function render(){
  const query=submittedQuery;
  const matchesNow=mode==="search"?(query?cases.filter(item=>matches(item,query)):[]):recent.map(id=>cases.find(item=>item.id===id)).filter(Boolean);
  if(mode==="search"&&active&&!matchesNow.some(item=>item.id===active))active=undefined;
  $("list-title").textContent=mode==="search"?"Search Results":"Recently Opened Cases";
  $("count").textContent=String(matchesNow.length);
  const results=$("results");
  results.replaceChildren();
  for(const item of matchesNow){
    const choice=button(item.client,()=>{
      openCase(item.id);
      [...results.children].find(child=>child.getAttribute("aria-pressed")==="true")?.focus();
    },"case-choice");
    choice.setAttribute("aria-pressed",String(active===item.id));
    const caseLabel=item.caseNumber??item.id;
    choice.append(node("small",caseLabel?caseLabel+" · "+item.title:"No case assigned"));
    if(item.phone)choice.append(node("small",item.phone));
    results.append(choice);
  }
  if(!matchesNow.length)results.append(node("p",mode==="home"?"No cases opened yet.":(query?"No matching clients or cases.":searchHint),"empty"));
  renderCase();
}
function itemList(items,type){
  const list=node("ul",undefined,"rows");
  for(const item of items){
    const li=node("li");
    li.append(node(type==="note"?"p":"strong",type==="note"?item.text:item.name,type==="note"?"note-text":""));
    li.append(node("p",item.author+" · "+dateFormat.format(new Date(item.date)),"byline"));
    list.append(li);
  }
  return list;
}
function section(title,action){
  const block=node("section",undefined,"section");
  const head=node("div",undefined,"section-head");
  head.append(node("h2",title));
  if(action)head.append(action);
  block.append(head);
  return block;
}
function driveFolderAction(item){
  const key="jlc-demo-drive-folder:"+item.id;
  let saved="";
  try{saved=sessionStorage.getItem(key)??"";}catch{}
  const valid=value=>{
    try{
      const url=new URL(value);
      return url.origin==="https://drive.google.com"&&/^\/drive\/folders\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)&&!url.username&&!url.password;
    }catch{return false;}
  };
  const actions=node("div",undefined,"drive-actions");
  if(valid(saved)){
    const open=node("a","Open Google Drive Folder","drive-open");
    open.href=saved;
    open.target="_blank";
    open.rel="noopener noreferrer";
    actions.append(open);
  }
  actions.append(button(valid(saved)?"Change Drive link":"Link Google Drive Folder",()=>{
    const dialog=$("drive-dialog"), form=$("drive-form");
    form.elements.folder.value=saved;
    $("drive-error").textContent="";
    form.onsubmit=event=>{
      event.preventDefault();
      const value=form.elements.folder.value.trim();
      if(!valid(value)){$("drive-error").textContent="Enter a Google Drive folder link.";return;}
      try{sessionStorage.setItem(key,value);}catch{$("drive-error").textContent="This browser could not save the link.";return;}
      dialog.close();
      renderCase();
    };
    dialog.showModal();
  }));
  return actions;
}
function facts(entries){
  const list=node("dl",undefined,"facts");
  for(const [label,value] of entries){
    if(!value)continue;
    const row=node("div");
    row.append(node("dt",label),node("dd",value));
    list.append(row);
  }
  return list;
}
function contactFields(contact){
  return [["Role",contact.role],["Organization",contact.office],["Phone",contact.phone],["Email",contact.email],["Mailing address",contact.address]];
}
function caseContacts(item){
  const data=caseDetails[item.id]??{parties:[]}, client=clientContacts[item.clientId]??{};
  const block=section("Parties and contacts");
  block.id="case-contacts";
  const court=facts([["Court",data.court],["Jurisdiction",data.jurisdiction],["Judge",data.judge]]);
  if(court.children.length)block.append(court);
  const columns=node("div",undefined,"contact-columns");
  const clientPanel=node("div",undefined,"contact-panel");
  clientPanel.append(node("h3","Client"),node("p",item.client,"contact-name"),facts([
    ["Client ID",item.clientId],["Phone",item.phone],["Email",client.email],
    ["Mailing address",client.address],["Preferred contact",client.preferred]
  ]));
  const opposition=node("div",undefined,"contact-panel");
  opposition.append(node("h3","Opposing parties and counsel"));
  if(!data.parties.length)opposition.append(node("p","No opposing parties recorded.","muted"));
  for(const party of data.parties){
    const panel=node("div",undefined,"party");
    panel.append(node("p",party.name,"contact-name"),facts([["Party type",party.type],...contactFields(party)]));
    if(!party.attorneys.length)panel.append(node("p","No attorney recorded.","muted"));
    for(const attorney of party.attorneys){
      const card=node("div",undefined,"attorney");
      card.append(node("p",attorney.name,"contact-name"),facts(contactFields(attorney)));
      panel.append(card);
    }
    opposition.append(panel);
  }
  columns.append(clientPanel,opposition);
  block.append(columns);
  return block;
}
function renderCase(){
  const display=$("case");
  display.replaceChildren();
  const item=current();
  if(!item)return;
  const heading=node("h2",item.client,"case-title");
  const meta=node("div",undefined,"case-meta");
  for(const value of [item.title,item.status,item.phone,"Client ID "+item.clientId,item.next?"Next date "+item.next:""]){if(value)meta.append(node("span",value));}
  const contactLink=node("a","Parties and contacts");
  contactLink.href="#case-contacts";
  meta.append(contactLink);
  display.append(node("p",(item.caseNumber??item.id)||"Client intake","case-id"),heading,meta);
  if(item.caseNumber===""){
    display.append(caseContacts(item));
    return;
  }
  const note=section("Latest case note",button("Add note",()=>$("note-dialog").showModal(),"primary"));
  const latest=item.notes[0];
  if(latest){
    const block=node("div",undefined,"latest");
    block.append(node("p",latest.text,"note-text"),node("div",latest.author+" · "+dateFormat.format(new Date(latest.date)),"byline"));
    note.append(block);
    const history=node("details");
    const filter=node("input",undefined,"note-filter");
    filter.type="search";
    filter.placeholder="Search these notes";
    filter.setAttribute("aria-label","Search case notes");
    const historyResults=node("div");
    const renderHistory=()=>{
      const phrase=filter.value.trim().toLowerCase();
      const filtered=item.notes.filter(note=>(note.text+" "+note.author).toLowerCase().includes(phrase));
      historyResults.replaceChildren(filtered.length?itemList(filtered,"note"):node("p","No matching notes.","muted"));
    };
    filter.addEventListener("input",renderHistory);
    renderHistory();
    history.append(node("summary","Note history ("+item.notes.length+")"),filter,historyResults);
    note.append(history);
  } else note.append(node("p","No notes yet.","muted"));
  const docs=section("Recent documents",button("Add documents",()=>$("files-dialog").showModal()));
  docs.append(driveFolderAction(item));
  if(item.docs.length){
    docs.append(itemList(item.docs.slice(0,3),"doc"));
    const all=node("details");
    all.append(node("summary","All documents ("+item.docs.length+")"),itemList(item.docs,"doc"));
    docs.append(all);
  } else docs.append(node("p","No documents yet.","muted"));
  display.append(note,docs,caseContacts(item));
}
$("search-panel").addEventListener("submit",event=>{
  event.preventDefault();
  submittedQuery=$("search").value.trim().toLowerCase();
  if(!submittedQuery){$("search").focus();return;}
  mode="search";
  active=undefined;
  render();
});
$("search-client").addEventListener("click",()=>startSearch());
$("send-letter").addEventListener("click",()=>showDocument("letter"));
$("send-invoice").addEventListener("click",()=>showDocument("invoice"));
$("back-home").addEventListener("click",()=>{
  active=undefined;
  mode="home";
  pendingDocument=undefined;
  $("search-panel").hidden=true;
  $("search").value="";
  render();
  $("search-client").focus();
});
$("new-client").addEventListener("click",()=>{
  $("intake-error").textContent="";
  $("client-dialog").showModal();
});
$("client-form").addEventListener("submit",event=>{
  event.preventDefault();
  const form=event.currentTarget, data=new FormData(form);
  const get=name=>String(data.get(name)??"").trim();
  const client=get("client"), caseNumber=get("caseNumber");
  const error=$("intake-error");
  if(!client){error.textContent="Enter a client or organization name.";return;}
  if(caseNumber&&cases.some(item=>(item.caseNumber??item.id).toLowerCase()===caseNumber.toLowerCase())){
    error.textContent="That case number is already in this preview.";return;
  }
  const clientId=String(nextClientId++);
  const id="record-"+clientId;
  clientContacts[clientId]={email:get("email"),address:get("address"),preferred:get("preferred")};
  cases.unshift({id,caseNumber,client,clientId,phone:get("phone"),title:get("caseTitle")||"New intake",status:caseNumber?"Open":"",next:"",notes:[],docs:[]});
  mode="home";
  pendingDocument=undefined;
  $("search-panel").hidden=true;
  $("search").value="";
  form.reset();
  $("client-dialog").close();
  openCase(id);
});
for(const button of document.querySelectorAll("[data-close]"))button.addEventListener("click",()=>button.closest("dialog").close());
$("note-form").addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const author=data.get("author").trim(), text=data.get("text").trim();
  if(!author||!text)return;
  current().notes.unshift({author,text,date:new Date().toISOString()});
  event.currentTarget.reset();
  $("note-dialog").close();
  renderCase();
});
$("files-form").addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const author=data.get("author").trim();
  if(!author)return;
  const date=new Date().toISOString();
  const rows=data.getAll("files").filter(file=>file.name).map(file=>({name:file.name,author,date}));
  current().docs.unshift(...rows);
  event.currentTarget.reset();
  $("files-dialog").close();
  renderCase();
});
render();
