const userData = localStorage.getItem("user");

if(!userData){
  window.location.href = "setup.html";
}
else{
  const user = JSON.parse(userData);
  document.querySelector("h2").innerText =
    `Today's Plan for ${user.name}`;
}