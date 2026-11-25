"use strict";
const loginForm=document.getElementById("demo-login-form");
const loginScreen=document.getElementById("login-screen");
const staffScreen=document.getElementById("staff-screen");
const error=document.getElementById("login-error");
loginForm.addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(loginForm);
  if(data.get("username").trim().toLowerCase()!=="demo-admin"||data.get("password")!=="JLC-Demo-2026!"){
    error.textContent="Enter the sample username and password shown above.";
    return;
  }
  error.textContent="";
  loginForm.reset();
  loginScreen.hidden=true;
  staffScreen.hidden=false;
  document.getElementById("search-client").focus();
});
document.getElementById("demo-signout").addEventListener("click",()=>location.reload());
