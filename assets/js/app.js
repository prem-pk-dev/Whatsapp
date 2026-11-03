document.addEventListener('DOMContentLoaded',()=>{
  if(window.lucide)lucide.createIcons();
  const menu=document.getElementById('menuBtn');
  const sidebar=document.getElementById('sidebar');
  const setMenu=(open)=>{
    if(!sidebar)return;
    sidebar.classList.toggle('open',open);
    if(menu)menu.setAttribute('aria-expanded',String(open));
  };
  if(menu&&sidebar){
    menu.addEventListener('click',()=>setMenu(!sidebar.classList.contains('open')));
    sidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
    document.addEventListener('click',event=>{
      if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!event.target.closest('#menuBtn'))setMenu(false);
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false);});
  }
  const btn=document.getElementById('newCampaign');
  const toast=document.getElementById('toast');
  if(btn&&toast)btn.addEventListener('click',()=>{
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2600);
  });
});